import { z } from "zod";
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

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

const fallbackMap = [
  { key: "bollywood", mood: "Heartbroken", genre: "Bollywood", language: "Hindi", activity: "Reflecting", title: "Monsoon Breakup Radio" },
  { key: "gym", mood: "Energized", genre: "Pop and Hip-Hop", language: "Any", activity: "Workout", title: "Pulse Mode" },
  { key: "coding", mood: "Focused", genre: "Lo-fi Electronica", language: "Instrumental", activity: "Late night coding", title: "Midnight Compile" },
  { key: "study", mood: "Calm", genre: "Ambient Lo-fi", language: "Instrumental", activity: "Studying", title: "Soft Focus Desk" },
];

export function fallbackAnalysis(prompt: string): MoodAnalysis {
  const lower = prompt.toLowerCase();
  const match = fallbackMap.find((item) => lower.includes(item.key)) ?? {
    mood: "Curious",
    genre: "Modern Mix",
    language: "Any",
    activity: "Listening",
    title: "Moodify Signal",
  };

  return {
    ...match,
    energy: lower.includes("sad") || lower.includes("relax") ? 35 : lower.includes("gym") ? 92 : 62,
    description: `A polished ${match.genre.toLowerCase()} playlist shaped around "${prompt}" with tracks selected for ${match.activity.toLowerCase()}.`,
    queries: [
      `${prompt} playlist`,
      `${match.mood} ${match.genre} songs`,
      `${match.activity} music ${match.language}`,
    ],
  };
}

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) return candidate;
  return candidate.slice(start, end + 1);
}

function getGeminiKey() {
  return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY ?? process.env.GOOGLE_API_KEY;
}

export async function analyzePrompt(prompt: string): Promise<MoodAnalysis> {
  const key = getGeminiKey();
  if (!key) {
    console.warn("[Moodify][Gemini] Gemini API key missing. Using fallback analysis.");
    return fallbackAnalysis(prompt);
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-1.5-flash-latest";
  const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`);
  url.searchParams.set("key", key);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0.35,
          responseMimeType: "application/json",
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  "Analyze this natural language music prompt for a playlist app.",
                  "Return JSON only with exactly these fields:",
                  "mood string, genre string, language string, activity string, energy number 0-100, title string, description string, queries string array with 3-5 optimized YouTube search queries.",
                  `Prompt: ${prompt}`,
                ].join("\n"),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[Moodify][Gemini] request failed:", {
        status: response.status,
        statusText: response.statusText,
        body: await response.text(),
      });
      return fallbackAnalysis(prompt);
    }

    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    const parsedJson = JSON.parse(extractJson(text));
    const parsed = analysisSchema.safeParse(parsedJson);

    if (!parsed.success) {
      console.error("[Moodify][Gemini] invalid analysis shape:", parsed.error.flatten());
      return fallbackAnalysis(prompt);
    }

    console.log("[Moodify][Gemini] analysis generated:", {
      model,
      title: parsed.data.title,
      queries: parsed.data.queries,
    });

    return parsed.data;
  } catch (error) {
    console.error("[Moodify][Gemini] analysis error:", error);
    return fallbackAnalysis(prompt);
  }
}
