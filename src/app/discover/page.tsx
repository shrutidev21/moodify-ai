import { PromptComposer } from "@/components/music/prompt-composer";
import { PlaylistView } from "@/components/music/playlist-view";

export default function DiscoverPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Discover</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Turn a sentence into a playlist.</h1>
      </div>
      <div className="mb-10">
        <PromptComposer compact />
      </div>
      <PlaylistView />
    </div>
  );
}
