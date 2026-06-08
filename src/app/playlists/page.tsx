"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPlaylists, addPlaylist } from "@/features/playlists/playlistsSlice";
import { setCurrentPlaylist } from "@/features/playlist/playlistSlice";
import { useSessionGuard } from "@/lib/hooks/useSessionGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { Playlist } from "@/types/music";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isPlaylist(value: unknown): value is Playlist {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.prompt === "string" &&
    typeof value.createdAt === "string" &&
    isRecord(value.analysis) &&
    Array.isArray(value.songs)
  );
}

export default function PlaylistsPage() {
  const dispatch = useAppDispatch();
  const { items, loading, pageSize, total } = useAppSelector((state) => state.playlists);
  const [p, setP] = useState<number>(1);

  const ready = useSessionGuard();

  useEffect(() => {
    if (!ready) return;
    // load local saved playlists stored by PlaylistView for demo environments
    try {
      const key = "moodify:local_playlists";
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        const arr = Array.isArray(parsed) ? parsed.filter(isPlaylist) : [];
        arr.slice(0, 10).reverse().forEach((pl) => dispatch(addPlaylist(pl)));
      }
    } catch {
      // ignore
    }
    dispatch(fetchPlaylists({ page: p, pageSize }));
  }, [dispatch, p, pageSize, ready]);

  if (!ready) {
    return <div className="mx-auto max-w-6xl px-4 py-10"><p className="text-center text-zinc-400">Checking session…</p></div>;
  }

  const totalPages = Math.max(1, Math.ceil((total ?? items.length) / pageSize));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-black mb-6">Playlists</h1>

      {loading && <p>Loading...</p>}
      {!loading && items.length === 0 && <Card className="p-6 text-center">No playlists yet. Save one from the Discover page.</Card>}

      <div className="grid gap-4">
        {items.map((pl, index) => (
          <motion.div key={pl.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-zinc-400">{format(new Date(pl.createdAt), "PPP p")}</div>
                  <h3 className="mt-1 text-lg font-semibold">{pl.title}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{pl.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button onClick={() => dispatch(setCurrentPlaylist(pl))}>Replay</Button>
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
