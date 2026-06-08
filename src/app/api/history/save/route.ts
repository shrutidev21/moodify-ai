import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { resolveAppUserId } from "@/lib/supabase/resolveAppUserId";
import { getErrorMessage } from "@/lib/utils";

const songSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  channelTitle: z.string(),
  thumbnailUrl: z.string(),
  duration: z.string(),
});

const bodySchema = z.object({
  id: z.string().optional(),
  prompt: z.string(),
  analysis: z.record(z.string(), z.unknown()),
  songs: z.array(songSchema),
  userId: z.string().nullable().optional(),
});

type SaveHistoryRequest = z.infer<typeof bodySchema>;

interface SaveHistoryResponse {
  saved?: boolean;
  mode?: "demo" | "supabase";
  id?: string;
  error?: string;
}

function isMissingAppTableError(message: string) {
  return message.includes("Could not find the table") || message.includes("schema cache");
}

export async function POST(request: Request): Promise<Response> {
  try {
    const rawBody = await request.text();
    if (!rawBody) {
      console.warn("[Moodify][history/save] empty body");
      return NextResponse.json<SaveHistoryResponse>({ error: "Invalid payload" }, { status: 400 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch (parseError: unknown) {
      console.error("[Moodify][history/save] JSON parse error:", getErrorMessage(parseError));
      return NextResponse.json<SaveHistoryResponse>({ error: "Invalid JSON" }, { status: 400 });
    }

    const body = bodySchema.safeParse(parsed);
    if (!body.success) {
      console.warn("[Moodify][history/save] validation failed:", body.error.flatten());
      return NextResponse.json<SaveHistoryResponse>({ error: "Invalid payload" }, { status: 400 });
    }

    const { prompt, analysis, songs, userId }: SaveHistoryRequest = body.data;
    console.log("[Moodify][history/save] request:", {
      promptPreview: prompt.slice(0, 80),
      mood: analysis.mood,
      songCount: songs.length,
      hasAuthUserId: Boolean(userId),
    });

    const supabase = createSupabaseAdmin();
    if (!supabase) {
      console.warn("[Moodify][history/save] no admin client — demo mode");
      return NextResponse.json<SaveHistoryResponse>({
        saved: true,
        mode: "demo",
        id: `local-${Date.now()}`,
      });
    }

    let appUserId: string | null = null;

    if (userId) {
      const resolved = await resolveAppUserId(supabase, userId);
      if (resolved.missingTables) {
        console.warn("[Moodify][history/save] users table missing — demo mode");
        return NextResponse.json<SaveHistoryResponse>({
          saved: true,
          mode: "demo",
          id: `local-${Date.now()}`,
        });
      }
      if (resolved.error) {
        console.error("[Moodify][history/save] resolve user failed:", resolved.error);
        return NextResponse.json<SaveHistoryResponse>({ error: resolved.error }, { status: 500 });
      }
      appUserId = resolved.appUserId;
    }

    const { data, error } = await supabase
      .from("mood_history")
      .insert({
        user_id: appUserId,
        user_input: prompt,
        primary_mood: String(analysis.mood ?? ""),
        secondary_mood: String(analysis.genre ?? ""),
        recommended_songs: songs,
      })
      .select("id")
      .single();

    if (error) {
      const msg = error.message ?? "";
      console.error("[Moodify][history/save] insert failed:", msg);
      if (isMissingAppTableError(msg)) {
        return NextResponse.json<SaveHistoryResponse>({
          saved: true,
          mode: "demo",
          id: `local-${Date.now()}`,
        });
      }
      return NextResponse.json<SaveHistoryResponse>({ error: msg }, { status: 500 });
    }

    console.log("[Moodify][history/save] saved:", { id: data.id, appUserId });
    return NextResponse.json<SaveHistoryResponse>({
      saved: true,
      mode: "supabase",
      id: data.id,
    });
  } catch (error: unknown) {
    console.error("[Moodify][history/save] error:", getErrorMessage(error));
    return NextResponse.json<SaveHistoryResponse>({
      saved: true,
      mode: "demo",
      id: `local-${Date.now()}`,
    });
  }
}
