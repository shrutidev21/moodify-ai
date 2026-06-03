"use client";

import Link from "next/link";
import { ArrowRight, Brain, Radio, WandSparkles } from "lucide-react";
import { motion } from "framer-motion";
import { PromptComposer } from "@/components/music/prompt-composer";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl text-center">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300">
          AI music concierge
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-5 text-5xl font-black tracking-tight sm:text-7xl">
          Moodify AI
        </motion.h1>
        <p className="mx-auto mt-5 max-w-3xl text-lg text-zinc-300 sm:text-xl">
          Describe the feeling, scene, language, or activity. Moodify analyzes your intent and builds a playable YouTube playlist in seconds.
        </p>
      </div>
      <div className="mt-10">
        <PromptComposer />
      </div>
      <div className="mt-10 grid gap-3 md:grid-cols-3">
        {[
          { icon: Brain, title: "Intent aware", text: "Detects mood, genre, language, activity, and energy." },
          { icon: WandSparkles, title: "Search optimized", text: "Turns vague prompts into precise music discovery queries." },
          { icon: Radio, title: "Playable instantly", text: "Creates an embedded YouTube playlist with rich metadata." },
        ].map((item) => (
          <motion.div whileHover={{ y: -4 }} key={item.title} className="rounded-lg border border-white/10 bg-white/[0.05] p-5">
            <item.icon className="size-5 text-emerald-300" />
            <h3 className="mt-4 font-bold">{item.title}</h3>
            <p className="mt-2 text-sm text-zinc-400">{item.text}</p>
          </motion.div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Button asChild variant="secondary">
          <Link href="/discover">Open Discover <ArrowRight className="size-4" /></Link>
        </Button>
      </div>
    </section>
  );
}
