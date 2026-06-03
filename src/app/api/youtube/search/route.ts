import { NextResponse } from "next/server";
import { z } from "zod";
import { searchVideos } from "@/lib/youtube/searchVideos";

const bodySchema = z.object({
  analysis: z.object({
    mood: z.string(),
    genre: z.string(),
    language: z.string(),
    activity: z.string(),
    energy: z.number(),
    title: z.string(),
    description: z.string(),
    queries: z.array(z.string()),
  }),
});

export async function POST(request: Request) {
  const payload = await request.json();
  console.log("[Moodify][YouTube route] request body:", payload);

  const body = bodySchema.safeParse(payload);
  if (!body.success) {
    console.error("[Moodify][YouTube route] invalid body:", body.error.flatten());
    return NextResponse.json({ error: "Analysis is required." }, { status: 400 });
  }

  const result = await searchVideos(body.data.analysis);
  console.log("[Moodify][YouTube route] result:", result.debug);

  return NextResponse.json(result);
}
