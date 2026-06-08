"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchHistory, addSearch } from "@/features/history/historySlice";
import { setCurrentPlaylist } from "@/features/playlist/playlistSlice";
import { useSessionGuard } from "@/lib/hooks/useSessionGuard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import type { MoodHistoryItem } from "@/features/history/historySlice";
import type { Playlist, SearchHistoryItem, Song } from "@/types/music";

type HistorySong = Partial<Song> & {
  youtube_video_id?: string;
  channel_title?: string;
  thumbnail_url?: string;
  name?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isSearchHistoryItem(value: unknown): value is SearchHistoryItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.prompt === "string" &&
    typeof value.title === "string" &&
    typeof value.createdAt === "string"
  );
}

export default function HistoryPage() {
  const dispatch = useAppDispatch();
  const { items, loading, page, pageSize, total } = useAppSelector((state) => state.history);
  const [p, setP] = useState<number>(page);

  useEffect(() => {
    // load local optimistic history saved by PromptComposer so sessions survive reloads when DB is absent
    try {
      const key = "moodify:local_history";
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        const arr = Array.isArray(parsed) ? parsed.filter(isSearchHistoryItem) : [];
        // replay in reverse so newest appear first via addSearch
        arr.slice(0, 10).reverse().forEach((it) => dispatch(addSearch(it)));
      }
    } catch {
      // ignore
    }

    dispatch(fetchHistory({ page: p, pageSize }));
  }, [dispatch, p, pageSize]);

  function replay(item: MoodHistoryItem) {
    const playlist: Playlist = {
      id: `history-${item.id}`,
      title: item.primary_mood ?? "Moodify List",
      description: item.user_input,
      prompt: item.user_input,
      analysis: { mood: item.primary_mood ?? "", genre: item.secondary_mood ?? "", language: "", activity: "", energy: 50, title: item.primary_mood ?? "", description: item.user_input, queries: [] },
      songs: (item.recommended_songs ?? []).map((song: HistorySong, index) => ({ id: `h-${item.id}-${index}`, videoId: song.videoId ?? song.youtube_video_id ?? song.id ?? "", title: song.title ?? song.name ?? "Unknown", channelTitle: song.channelTitle ?? song.channel_title ?? "", thumbnailUrl: song.thumbnailUrl ?? song.thumbnail_url ?? "", duration: song.duration ?? "" })),
      createdAt: item.created_at,
    };
    dispatch(setCurrentPlaylist(playlist));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const totalPages = Math.max(1, Math.ceil((total ?? items.length) / pageSize));

  const ready = useSessionGuard();

  if (!ready) {
    return <div className="mx-auto max-w-5xl px-4 py-10"><p className="text-center text-zinc-400">Redirecting to sign in…</p></div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-black mb-6">History</h1>

      {loading && <p>Loading...</p>}
      {!loading && items.length === 0 && <Card className="p-6 text-center">No history yet. Generate a playlist to save your sessions.</Card>}

      <div className="grid gap-4">
        {items.map((item, index) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <Card className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-zinc-400">{format(new Date(item.created_at), "PPP p")}</div>
                  <h3 className="mt-1 text-lg font-semibold">{item.user_input}</h3>
                  <div className="mt-2 text-sm text-zinc-300">Detected: {item.primary_mood} • {item.secondary_mood}</div>
                  <div className="mt-3 grid gap-2">
                    {(item.recommended_songs ?? []).slice(0, 6).map((song: HistorySong, index) => (
                      <div key={index} className="text-sm text-zinc-300">{song.title ?? song.name ?? song.videoId}</div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button onClick={() => replay(item)}>Replay</Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-zinc-400">Page {p} of {totalPages}</div>
        <div className="flex items-center gap-2">
          <Button disabled={p <= 1} onClick={() => setP((v) => Math.max(1, v - 1))}>Prev</Button>
          <Button disabled={p >= totalPages} onClick={() => setP((v) => Math.min(totalPages, v + 1))}>Next</Button>
        </div>
      </div>
    </div>
  );
}
