import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { MoodAnalysis } from "@/types/music";

const analysisSchema = z.object({
  mood: z.string(),
  genre: z.string(),
  language: z.string(),
  activity: z.string(),
  energy: z.number().min(0).max(100),
  title: z.string(),
  description: z.string(),
  queries: z.array(z.string()).min(2).max(6),
});

type CachedAnalysisRow = {
  analysis: unknown;
};

type MemoryCacheStore = {
  byPrompt: Map<string, MoodAnalysis>;
  byCategory: Map<string, MoodAnalysis>;
};

const memoryKey = Symbol.for("moodify.ai.analysisCache");

function getMemoryCache(): MemoryCacheStore {
  const globalStore = globalThis as typeof globalThis & { [memoryKey]?: MemoryCacheStore };
  if (!globalStore[memoryKey]) {
    globalStore[memoryKey] = {
      byPrompt: new Map(),
      byCategory: new Map(),
    };
  }
  return globalStore[memoryKey];
}

export function normalizePrompt(prompt: string) {
  return prompt.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeCategory(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Maps prompts to a stable category bucket for cache reuse. */
export function derivePromptCategoryKey(prompt: string) {
  const normalized = normalizePrompt(prompt);
  const buckets = [
    { key: "bollywood-breakup", words: ["bollywood", "breakup", "sad hindi", "heartbreak", "heart break"] },
    { key: "gym-energy", words: ["gym", "workout", "exercise", "running", "energetic", "energy"] },
    { key: "coding-focus", words: ["coding", "programming", "developer", "compile", "late night", "deep work", "focus"] },
    { key: "study-calm", words: ["study", "studying", "homework", "reading", "concentration", "exam"] },
    { key: "relax-calm", words: ["relax", "relaxing", "sleep", "calm", "meditation", "chill"] },
    { key: "party-pop", words: ["party", "dance", "club", "celebration", "dj"] },
  ];

  return buckets.find((bucket) => bucket.words.some((word) => normalized.includes(word)))?.key ?? null;
}

export function getAnalysisCategoryKey(analysis: MoodAnalysis) {
  return [analysis.mood, analysis.genre, analysis.language, analysis.activity]
    .map(normalizeCategory)
    .filter(Boolean)
    .join(":");
}

function parseAnalysis(value: unknown): MoodAnalysis | null {
  const parsed = analysisSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function readMemory(prompt: string): MoodAnalysis | null {
  const cache = getMemoryCache();
  const promptKey = normalizePrompt(prompt);
  const promptHit = cache.byPrompt.get(promptKey);
  if (promptHit) return promptHit;

  const categoryKey = derivePromptCategoryKey(prompt);
  if (!categoryKey) return null;

  return cache.byCategory.get(categoryKey) ?? null;
}

function writeMemory(prompt: string, analysis: MoodAnalysis) {
  const cache = getMemoryCache();
  const promptKey = normalizePrompt(prompt);
  const categoryKey = derivePromptCategoryKey(prompt) ?? getAnalysisCategoryKey(analysis);

  cache.byPrompt.set(promptKey, analysis);
  if (categoryKey) {
    cache.byCategory.set(categoryKey, analysis);
  }
}

export type CacheLookupResult =
  | { hit: true; analysis: MoodAnalysis; source: "memory-prompt" | "memory-category" | "supabase-prompt" | "supabase-category" }
  | { hit: false; reason: string };

export async function getCachedAnalysis(prompt: string): Promise<CacheLookupResult> {
  const promptKey = normalizePrompt(prompt);
  const categoryKey = derivePromptCategoryKey(prompt);

  const memoryHit = readMemory(prompt);
  if (memoryHit) {
    const source = getMemoryCache().byPrompt.has(promptKey) ? "memory-prompt" : "memory-category";
    console.log("[Moodify][AI Cache] HIT (memory):", { source, promptKey, categoryKey });
    return { hit: true, analysis: memoryHit, source };
  }

  const supabase = createSupabaseAdmin();
  if (!supabase) {
    return { hit: false, reason: "no_supabase_admin_client" };
  }

  const promptResult = await supabase
    .from("ai_analysis_cache")
    .select("analysis")
    .eq("prompt_key", promptKey)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<CachedAnalysisRow>();

  if (promptResult.error) {
    const msg = promptResult.error.message ?? "";
    if (msg.includes("Could not find the table") || msg.includes("schema cache")) {
      return { hit: false, reason: "ai_analysis_cache_table_missing" };
    }
    console.warn("[Moodify][AI Cache] prompt read skipped:", msg);
    return { hit: false, reason: "supabase_prompt_read_error" };
  }

  const promptMatch = parseAnalysis(promptResult.data?.analysis);
  if (promptMatch) {
    writeMemory(prompt, promptMatch);
    console.log("[Moodify][AI Cache] HIT (supabase-prompt):", { promptKey });
    return { hit: true, analysis: promptMatch, source: "supabase-prompt" };
  }

  if (!categoryKey) {
    return { hit: false, reason: "no_category_bucket" };
  }

  const categoryResult = await supabase
    .from("ai_analysis_cache")
    .select("analysis")
    .eq("category_key", categoryKey)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<CachedAnalysisRow>();

  if (categoryResult.error) {
    console.warn("[Moodify][AI Cache] category read skipped:", categoryResult.error.message);
    return { hit: false, reason: "supabase_category_read_error" };
  }

  const categoryMatch = parseAnalysis(categoryResult.data?.analysis);
  if (categoryMatch) {
    writeMemory(prompt, categoryMatch);
    console.log("[Moodify][AI Cache] HIT (supabase-category):", { categoryKey });
    return { hit: true, analysis: categoryMatch, source: "supabase-category" };
  }

  return { hit: false, reason: "cache_miss" };
}

export async function saveCachedAnalysis(prompt: string, analysis: MoodAnalysis) {
  writeMemory(prompt, analysis);

  const supabase = createSupabaseAdmin();
  if (!supabase) {
    console.warn("[Moodify][AI Cache] write skipped: no Supabase admin client (set SUPABASE_SERVICE_ROLE_KEY)");
    return;
  }

  const promptKey = normalizePrompt(prompt);
  const categoryKey = derivePromptCategoryKey(prompt) ?? getAnalysisCategoryKey(analysis);

  const { error } = await supabase.from("ai_analysis_cache").upsert(
    {
      prompt_key: promptKey,
      category_key: categoryKey,
      prompt,
      mood: analysis.mood,
      genre: analysis.genre,
      language: analysis.language,
      activity: analysis.activity,
      analysis,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "prompt_key" },
  );

  if (error) {
    console.warn("[Moodify][AI Cache] Supabase write skipped:", error.message);
    return;
  }

  console.log("[Moodify][AI Cache] saved:", { promptKey, categoryKey });
}
