import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzePrompt } from "@/lib/ai/analyzePrompt";
import { getCachedAnalysis, saveCachedAnalysis } from "@/lib/ai/analysisCache";

const bodySchema = z.object({ prompt: z.string().min(2).max(240) });

export async function POST(request: Request) {
  const body = bodySchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Prompt is required." }, { status: 400 });

  const cacheResult = await getCachedAnalysis(body.data.prompt);
  if (cacheResult.hit) {
    return NextResponse.json({
      analysis: cacheResult.analysis,
      cached: true,
      cacheSource: cacheResult.source,
    });
  }

  console.log("[Moodify][AI Cache] MISS — calling Gemini:", {
    reason: cacheResult.reason,
    promptPreview: body.data.prompt.slice(0, 80),
  });

  const analysis = await analyzePrompt(body.data.prompt);
  await saveCachedAnalysis(body.data.prompt, analysis);

  return NextResponse.json({
    analysis,
    cached: false,
    cacheSource: null,
  });
}
