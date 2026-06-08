"use client";

import { DashboardClient } from "@/components/sections/dashboard-client";
import { useSessionGuard } from "@/lib/hooks/useSessionGuard";

export default function DashboardPage() {
  const ready = useSessionGuard();

  if (!ready) {
    return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><p className="text-center text-zinc-400">Checking access…</p></div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Dashboard</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Your listening command center.</h1>
      </div>
      <DashboardClient />
    </div>
  );
}
