"use client";

import { PlaylistView } from "@/components/music/playlist-view";

export default function PlaylistPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Playlist</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Your latest generated vibe.</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Open playlists created from Discover without signing in. Sign in when you want to save them to your account.
        </p>
      </div>
      <PlaylistView />
    </div>
  );
}
