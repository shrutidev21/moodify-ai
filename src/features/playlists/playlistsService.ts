import { supabase } from "@/lib/supabase/client";
import type { Playlist } from "@/types/music";

interface PlaylistSongRow {
  id?: string;
  youtube_video_id?: string;
  videoId?: string;
  title?: string;
  channel_title?: string;
  channelTitle?: string;
  thumbnail_url?: string;
  thumbnailUrl?: string;
  duration?: string;
}

interface PlaylistRow {
  id: string;
  title: string;
  description: string;
  prompt?: string;
  mood?: string;
  genre?: string;
  language?: string;
  activity?: string;
  songs?: PlaylistSongRow[];
  playlist_songs?: PlaylistSongRow[];
  created_at: string;
}

export async function fetchPlaylists(page = 1, pageSize = 10): Promise<{ items: Playlist[]; total: number }> {
  const from = (page - 1) * pageSize;
  const to = page * pageSize - 1;
  const resp = await supabase
    .from("playlists")
    .select("*, playlist_songs(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (resp.error) throw resp.error;

  const items = (resp.data as PlaylistRow[] ?? []).map((row: PlaylistRow) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    prompt: row.prompt ?? "",
    analysis: {
      mood: row.mood ?? "",
      genre: row.genre ?? "",
      language: row.language ?? "",
      activity: row.activity ?? "",
      energy: 50,
      title: row.title ?? "",
      description: row.description ?? "",
      queries: [],
    },
    songs: (row.songs ?? row.playlist_songs ?? []).map((s: PlaylistSongRow, i: number) => ({
      id: s.id ?? `${row.id}-${i}`,
      videoId: s.youtube_video_id ?? s.videoId ?? s.id,
      title: s.title ?? "",
      channelTitle: s.channel_title ?? s.channelTitle ?? "",
      thumbnailUrl: s.thumbnail_url ?? s.thumbnailUrl ?? "",
      duration: s.duration ?? "",
    })),
    createdAt: row.created_at,
  } as Playlist));

  return { items, total: resp.count ?? items.length };
}
