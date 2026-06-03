"use client";

import Image from "next/image";
import { Check, Clock3, Play, Save } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { markPlaylistSaved, setActiveSong } from "@/features/playlist/playlistSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { Playlist } from "@/types/music";
import { cn } from "@/lib/utils";

export function PlaylistView({ playlist }: { playlist?: Playlist | null }) {
  const current = useAppSelector((state) => playlist ?? state.playlist.current);
  const activeSong = useAppSelector((state) => state.playlist.activeSong);
  const saved = useAppSelector((state) => (current ? state.playlist.savedIds.includes(current.id) : false));
  const dispatch = useAppDispatch();

  if (!current) {
    return (
      <Card className="mx-auto max-w-3xl p-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">No playlist yet</p>
        <h2 className="mt-3 text-3xl font-black">Generate a mood first</h2>
        <p className="mt-3 text-zinc-400">Head to Discover and ask Moodify for a vibe. Your generated playlist will appear here.</p>
      </Card>
    );
  }

  async function savePlaylist() {
    if (!current) return;
    const response = await fetch("/api/playlists/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playlist: current }),
    });
    if (response.ok) dispatch(markPlaylistSaved(current.id));
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div>
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {[current.analysis.mood, current.analysis.genre, current.analysis.language, current.analysis.activity].map((item) => (
                <Badge key={item}>{item}</Badge>
              ))}
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{current.title}</h1>
            <p className="mt-3 max-w-2xl text-zinc-400">{current.description}</p>
          </div>
          <Button onClick={savePlaylist} variant={saved ? "secondary" : "default"}>
            {saved ? <Check className="size-4" /> : <Save className="size-4" />}
            {saved ? "Playlist saved" : "Save playlist"}
          </Button>
        </div>
        <div className="grid gap-3">
          {current.songs.map((song, index) => (
            <motion.article
              data-testid="song-card"
              key={song.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={cn(
                "grid grid-cols-[72px_1fr_auto] items-center gap-4 rounded-lg border border-white/10 bg-white/[0.045] p-3 transition hover:bg-white/[0.08]",
                activeSong?.id === song.id && "border-emerald-300/60 bg-emerald-300/10",
              )}
            >
              <Image src={song.thumbnailUrl} alt="" width={72} height={54} className="h-[54px] rounded-md object-cover" />
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-white">{song.title}</h3>
                <p className="truncate text-xs text-zinc-400">{song.channelTitle}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-500">
                  <Clock3 className="size-3" /> {song.duration}
                </span>
              </div>
              <Button aria-label={`Play ${song.title}`} size="icon" variant="secondary" onClick={() => dispatch(setActiveSong(song))}>
                <Play className="size-4 fill-current" />
              </Button>
            </motion.article>
          ))}
        </div>
      </div>
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card className="overflow-hidden p-3">
          <div className="aspect-video overflow-hidden rounded-md bg-black">
            <iframe
              title="YouTube video player"
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${activeSong?.videoId ?? current.songs[0]?.videoId}?rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="mt-4 text-sm font-semibold">{activeSong?.title ?? current.songs[0]?.title}</p>
          <p className="text-xs text-zinc-400">{activeSong?.channelTitle ?? current.songs[0]?.channelTitle}</p>
        </Card>
      </aside>
    </section>
  );
}
