"use client";

import { FormEvent, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addSearch } from "@/features/history/historySlice";
import { setCurrentPlaylist } from "@/features/playlist/playlistSlice";
import { useAppDispatch } from "@/store/hooks";
import type { MoodAnalysis, Playlist, Song } from "@/types/music";
import { uid } from "@/lib/utils";

const examples = ["Give me late night coding music", "Sad Bollywood breakup songs", "Energetic gym songs", "Relaxing music for studying"];

export function PromptComposer({ compact = false }: { compact?: boolean }) {
  const [prompt, setPrompt] = useState(examples[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useAppDispatch();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    try {
      const aiResponse = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const aiJson = (await aiResponse.json()) as { analysis: MoodAnalysis; error?: string };
      if (!aiResponse.ok) throw new Error(aiJson.error);

      const musicResponse = await fetch("/api/youtube/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis: aiJson.analysis }),
      });
      const musicJson = (await musicResponse.json()) as {
        songs: Song[];
        debug?: {
          hasYouTubeKey: boolean;
          keyPreview: string;
          query?: string;
          source: "youtube" | "demo";
          reason?: string;
          searchStatus?: number;
          detailsStatus?: number;
          itemCount?: number;
        };
        error?: string;
      };
      if (!musicResponse.ok) throw new Error(musicJson.error);
      console.log("[Moodify][Browser] YouTube API response:", musicJson.debug);

      const playlist: Playlist = {
        id: uid("playlist"),
        title: aiJson.analysis.title,
        description: aiJson.analysis.description,
        prompt,
        analysis: aiJson.analysis,
        songs: musicJson.songs.slice(0, 6),
        createdAt: new Date().toISOString(),
      };
      dispatch(setCurrentPlaylist(playlist));
      dispatch(addSearch({ id: playlist.id, prompt, title: playlist.title, createdAt: playlist.createdAt }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not generate playlist.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={compact ? "" : "mx-auto max-w-4xl"}>
      <form onSubmit={onSubmit} className="rounded-lg border border-white/10 bg-white/[0.06] p-2 shadow-2xl shadow-emerald-950/20 backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Try late night coding, sad Bollywood, gym, studying..."
            aria-label="Music prompt"
            className="h-14 flex-1 rounded-lg border-transparent bg-zinc-950/80 text-base"
          />
          <Button type="submit" className="h-14 rounded-lg px-7" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Generate
          </Button>
        </div>
      </form>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {examples.map((example, index) => (
          <motion.button
            key={example}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setPrompt(example)}
            className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-zinc-300 transition hover:border-emerald-300/60 hover:text-white"
          >
            {example}
          </motion.button>
        ))}
      </div>
      {error && <p className="mt-3 text-center text-sm text-rose-300">{error}</p>}
    </div>
  );
}
