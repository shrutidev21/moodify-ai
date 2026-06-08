"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Check, Clock3, Pause, Play, Plus, Save, SkipBack, SkipForward } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { markPlaylistSaved, setActiveSong, toggleSongSaved } from "@/features/playlist/playlistSlice";
import { addPlaylist } from "@/features/playlists/playlistsSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { Playlist, Song } from "@/types/music";
import { cn } from "@/lib/utils";

export function PlaylistView({ playlist }: { playlist?: Playlist | null }) {
  const current = useAppSelector((state) => playlist ?? state.playlist.current);
  const activeSong = useAppSelector((state) => state.playlist.activeSong);
  const saved = useAppSelector((state) => (current ? state.playlist.savedIds.includes(current.id) : false));
  const selectedSongIds = useAppSelector((state) => state.playlist.selectedSongIds);
  const [playerStarted, setPlayerStarted] = useState(false);
  const dispatch = useAppDispatch();

  const selectedSongs = useMemo(() => {
    if (!current) return [];
    return current.songs.filter((song) => selectedSongIds.includes(song.id));
  }, [current, selectedSongIds]);

  const playerSong = activeSong ?? current?.songs[0] ?? null;
  const activeIndex = current && playerSong ? current.songs.findIndex((song) => song.id === playerSong.id) : -1;

  if (!current) {
    return (
      <Card className="mx-auto max-w-3xl p-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">No playlist yet</p>
        <h2 className="mt-3 text-3xl font-black">Generate a mood first</h2>
        <p className="mt-3 text-zinc-400">Head to Discover and ask Moodify for a vibe. Your generated playlist will appear here.</p>
      </Card>
    );
  }

  function playSong(song: Song) {
    dispatch(setActiveSong(song));
    setPlayerStarted(true);
  }

  function togglePlayer(song: Song) {
    if (playerStarted && activeSong?.id === song.id) {
      setPlayerStarted(false);
      return;
    }

    playSong(song);
  }

  function playByOffset(offset: number) {
    if (!current || activeIndex < 0) return;
    const nextIndex = (activeIndex + offset + current.songs.length) % current.songs.length;
    playSong(current.songs[nextIndex]);
  }

  async function savePlaylist() {
    if (!current || selectedSongs.length === 0) return;
    const playlistToSave: Playlist = {
      ...current,
      songs: selectedSongs,
      title:
        selectedSongs.length !== current.songs.length
          ? `${current.title} (${selectedSongs.length} tracks)`
          : current.title,
    };

    let userId = null;
    try {
      const sess = await (await import("@/features/auth/authService")).getSession();
      userId = sess?.user?.id ?? null;
    } catch {
      userId = null;
    }
    const response = await fetch("/api/playlists/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playlist: { ...playlistToSave, userId } }),
    });
    if (response.ok) {
      dispatch(markPlaylistSaved(current.id));
      // persist playlist optimistically for environments without DB
      try {
        const key = "moodify:local_playlists";
        const raw = localStorage.getItem(key);
        const arr = raw ? JSON.parse(raw) : [];
        arr.unshift(playlistToSave);
        const trimmed = arr.slice(0, 20);
        localStorage.setItem(key, JSON.stringify(trimmed));
      } catch {
        // ignore storage errors
      }
      dispatch(addPlaylist(playlistToSave));
    }
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
          <Button onClick={savePlaylist} variant={saved ? "secondary" : "default"} disabled={selectedSongs.length === 0}>
            {saved ? <Check className="size-4" /> : <Save className="size-4" />}
            {saved
              ? "Playlist saved"
              : `Save ${selectedSongs.length} ${selectedSongs.length === 1 ? "song" : "songs"}`}
          </Button>
        </div>
        <div className="mb-4 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-zinc-300">
          <span>{selectedSongs.length} of {current.songs.length} songs selected for saving</span>
          <span className="text-xs text-zinc-500">Mark songs with Add — none are selected by default.</span>
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
              <div className="flex items-center gap-2">
                <Button
                  aria-label={selectedSongIds.includes(song.id) ? `Remove ${song.title} from saved playlist` : `Add ${song.title} to saved playlist`}
                  size="sm"
                  variant={selectedSongIds.includes(song.id) ? "secondary" : "outline"}
                  onClick={() => dispatch(toggleSongSaved(song.id))}
                  className="hidden sm:inline-flex"
                >
                  {selectedSongIds.includes(song.id) ? <Check className="size-4" /> : <Plus className="size-4" />}
                  {selectedSongIds.includes(song.id) ? "Saved" : "Add"}
                </Button>
                <Button
                  aria-label={selectedSongIds.includes(song.id) ? `Remove ${song.title} from saved playlist` : `Add ${song.title} to saved playlist`}
                  size="icon"
                  variant={selectedSongIds.includes(song.id) ? "secondary" : "outline"}
                  onClick={() => dispatch(toggleSongSaved(song.id))}
                  className="sm:hidden"
                >
                  {selectedSongIds.includes(song.id) ? <Check className="size-4" /> : <Plus className="size-4" />}
                </Button>
                <Button aria-label={`Play ${song.title}`} size="icon" variant="secondary" onClick={() => togglePlayer(song)}>
                  {playerStarted && activeSong?.id === song.id ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
                </Button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card className="overflow-hidden border-white/10 bg-zinc-950 p-0">
          <div className="relative aspect-square bg-zinc-900">
            {playerSong && (
              <Image
                src={playerSong.thumbnailUrl}
                alt=""
                fill
                sizes="380px"
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">Now playing</p>
              <h2 className="mt-2 line-clamp-2 text-xl font-black text-white">{playerSong?.title ?? "No song selected"}</h2>
              <p className="mt-1 truncate text-sm text-zinc-300">{playerSong?.channelTitle}</p>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/3 rounded-full bg-emerald-400" />
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button type="button" variant="ghost" size="icon" onClick={() => playByOffset(-1)} aria-label="Previous song">
                <SkipBack className="size-5 fill-current" />
              </Button>
              <Button
                type="button"
                size="icon"
                className="h-14 w-14"
                onClick={() => {
                  if (playerSong) togglePlayer(playerSong);
                }}
                aria-label={playerStarted ? "Pause selected song" : "Play selected song"}
              >
                {playerStarted ? <Pause className="size-6 fill-current" /> : <Play className="size-6 fill-current" />}
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => playByOffset(1)} aria-label="Next song">
                <SkipForward className="size-5 fill-current" />
              </Button>
            </div>

            {playerSong && (
              <div className="aspect-video overflow-hidden rounded-lg border border-white/10 bg-black">
                <iframe
                  key={`${playerSong.videoId}-${playerStarted}`}
                  title={`${playerSong.title} player`}
                  className="h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${playerSong.videoId}?autoplay=${playerStarted ? "1" : "0"}&rel=0&modestbranding=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </Card>
      </aside>
    </section>
  );
}
