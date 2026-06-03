import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzePrompt } from "@/lib/ai/analyzePrompt";

const bodySchema = z.object({ prompt: z.string().min(2).max(240) });

export async function POST(request: Request) {
  const body = bodySchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  const analysis = await analyzePrompt(body.data.prompt);
  return NextResponse.json({ analysis });
}
