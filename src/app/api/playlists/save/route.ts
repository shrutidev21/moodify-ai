import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/utils";

const songSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  channelTitle: z.string(),
  thumbnailUrl: z.string(),
  duration: z.string(),
});

const bodySchema = z.object({
  playlist: z.object({
    title: z.string(),
    description: z.string(),
    prompt: z.string(),
    analysis: z.record(z.string(), z.unknown()),
    songs: z.array(songSchema),
    userId: z.string().nullable().optional(),
  }),
});

type SavePlaylistRequest = z.infer<typeof bodySchema>;

interface SavePlaylistResponse {
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
    let parsed: unknown;
    try {
      parsed = await request.json();
    } catch (parseError: unknown) {
      console.error("JSON parse error:", getErrorMessage(parseError));
      return NextResponse.json<SavePlaylistResponse>(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    const body = bodySchema.safeParse(parsed);
    if (!body.success) {
      return NextResponse.json<SavePlaylistResponse>(
        { error: "Playlist payload is invalid." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json<SavePlaylistResponse>({
        saved: true,
        mode: "demo",
        id: `local-${Date.now()}`,
      });
    }

    const { playlist }: SavePlaylistRequest = body.data;
    let appUserId: string | null = null;

    if (playlist.userId) {
      const { data: existingUser, error: existingUserError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", playlist.userId)
        .maybeSingle<{ id: string }>();

      if (existingUserError) {
        const msg = existingUserError.message ?? "";
        if (isMissingAppTableError(msg)) {
          return NextResponse.json<SavePlaylistResponse>({
            saved: true,
            mode: "demo",
            id: `local-${Date.now()}`,
          });
        }
        return NextResponse.json<SavePlaylistResponse>({ error: msg }, { status: 500 });
      }

      appUserId = existingUser?.id ?? null;

      if (!appUserId) {
        const { data: authUserResult } = await supabase.auth.admin.getUserById(playlist.userId);
        const authUser = authUserResult?.user;
        const { data: createdUser, error: createUserError } = await supabase
          .from("users")
          .insert({
            auth_user_id: playlist.userId,
            email: authUser?.email ?? null,
            display_name: authUser?.user_metadata?.full_name ?? authUser?.email?.split("@")[0] ?? null,
            avatar_url: authUser?.user_metadata?.avatar_url ?? null,
          })
          .select("id")
          .single<{ id: string }>();

        if (createUserError) {
          const msg = createUserError.message ?? "";
          if (isMissingAppTableError(msg)) {
            return NextResponse.json<SavePlaylistResponse>({
              saved: true,
              mode: "demo",
              id: `local-${Date.now()}`,
            });
          }
          return NextResponse.json<SavePlaylistResponse>({ error: msg }, { status: 500 });
        }

        appUserId = createdUser.id;
      }
    }

    const { data, error } = await supabase
      .from("playlists")
      .insert({
        title: playlist.title,
        description: playlist.description,
        prompt: playlist.prompt,
        songs: playlist.songs,
        cover_url: playlist.songs[0]?.thumbnailUrl,
        mood: String(playlist.analysis.mood ?? ""),
        genre: String(playlist.analysis.genre ?? ""),
        language: String(playlist.analysis.language ?? ""),
        activity: String(playlist.analysis.activity ?? ""),
        user_id: appUserId,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to insert playlist:", error.message);
      const msg = error.message ?? "";
      if (isMissingAppTableError(msg)) {
        return NextResponse.json<SavePlaylistResponse>({
          saved: true,
          mode: "demo",
          id: `local-${Date.now()}`,
        });
      }
      return NextResponse.json<SavePlaylistResponse>(
        { error: msg },
        { status: 500 }
      );
    }

    const { error: songsError } = await supabase
      .from("playlist_songs")
      .insert(
        playlist.songs.map((song, index) => ({
          playlist_id: data.id,
          youtube_video_id: song.videoId,
          title: song.title,
          channel_title: song.channelTitle,
          thumbnail_url: song.thumbnailUrl,
          duration: song.duration,
          position: index,
        }))
      );

    if (songsError) {
      console.error("Failed to insert playlist_songs:", songsError.message);
      const msg = songsError.message ?? "";
      if (isMissingAppTableError(msg)) {
        return NextResponse.json<SavePlaylistResponse>({
          saved: true,
          mode: "demo",
          id: `local-${Date.now()}`,
        });
      }
      return NextResponse.json<SavePlaylistResponse>(
        { error: msg },
        { status: 500 }
      );
    }

    return NextResponse.json<SavePlaylistResponse>({
      saved: true,
      mode: "supabase",
      id: data.id,
    });
  } catch (error: unknown) {
    console.error("playlists/save error:", getErrorMessage(error));
    return NextResponse.json<SavePlaylistResponse>({
      saved: true,
      mode: "demo",
      id: `local-${Date.now()}`,
    });
  }
}
