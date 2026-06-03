import { PlaylistView } from "@/components/music/playlist-view";
import { HeroSection } from "@/components/sections/hero-section";

export default function Home() {
  return (
    <>
      <HeroSection />
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <PlaylistView />
      </section>
    </>
  );
}
