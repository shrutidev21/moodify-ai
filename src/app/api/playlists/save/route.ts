import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const bodySchema = z.object({
  playlist: z.object({
    title: z.string(),
    description: z.string(),
    prompt: z.string(),
    analysis: z.record(z.string(), z.unknown()),
    songs: z.array(z.object({
      videoId: z.string(),
      title: z.string(),
      channelTitle: z.string(),
      thumbnailUrl: z.string(),
      duration: z.string(),
    })),
  }),
});

export async function POST(request: Request) {
  const body = bodySchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Playlist payload is invalid." }, { status: 400 });

  const supabase = createSupabaseAdmin();
  if (!supabase) return NextResponse.json({ saved: true, mode: "demo", id: `local-${Date.now()}` });

  const { playlist } = body.data;
  const { data, error } = await supabase
    .from("playlists")
    .insert({
      title: playlist.title,
      description: playlist.description,
      cover_url: playlist.songs[0]?.thumbnailUrl,
      mood: String(playlist.analysis.mood ?? ""),
      genre: String(playlist.analysis.genre ?? ""),
      language: String(playlist.analysis.language ?? ""),
      activity: String(playlist.analysis.activity ?? ""),
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("playlist_songs").insert(
    playlist.songs.map((song, index) => ({
      playlist_id: data.id,
      youtube_video_id: song.videoId,
      title: song.title,
      channel_title: song.channelTitle,
      thumbnail_url: song.thumbnailUrl,
      duration: song.duration,
      position: index,
    })),
  );

  return NextResponse.json({ saved: true, mode: "supabase", id: data.id });
}
