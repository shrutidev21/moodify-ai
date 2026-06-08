"use client";

import { BarChart3, History, ListMusic, Settings2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { setExplicitContent, setHighEnergyBias } from "@/features/preferences/preferencesSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function DashboardClient() {
  const playlist = useAppSelector((state) => state.playlist.current);
  const history = useAppSelector((state) => state.history.items);
  const preferences = useAppSelector((state) => state.preferences);
  const dispatch = useAppDispatch();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: ListMusic, label: "Active songs", value: playlist?.songs.length ?? 0 },
          { icon: History, label: "Recent searches", value: history.length },
          { icon: BarChart3, label: "Energy", value: playlist ? `${playlist.analysis.energy}%` : "0%" },
        ].map((stat) => (
          <Card key={stat.label} className="p-5">
            <stat.icon className="size-5 text-emerald-300" />
            <p className="mt-5 text-3xl font-black">{stat.value}</p>
            <p className="text-sm text-zinc-400">{stat.label}</p>
          </Card>
        ))}
        <Card className="p-5 sm:col-span-3">
          <h2 className="text-2xl font-black">Latest generated playlist</h2>
          <p className="mt-3 text-zinc-400">{playlist ? `${playlist.title}: ${playlist.description}` : "No playlist generated yet."}</p>
        </Card>
      </section>
      <aside className="space-y-4">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Settings2 className="size-5 text-emerald-300" />
            <h2 className="font-bold">Preferences</h2>
          </div>
          <label className="mt-5 flex items-center justify-between gap-4 text-sm">
            Bias toward high energy
            <Switch checked={preferences.highEnergyBias} onCheckedChange={(value) => dispatch(setHighEnergyBias(value))} />
          </label>
          <label className="mt-4 flex items-center justify-between gap-4 text-sm">
            Explicit content
            <Switch checked={preferences.explicitContent} onCheckedChange={(value) => dispatch(setExplicitContent(value))} />
          </label>
        </Card>
        <Card className="p-5">
          <h2 className="font-bold">Search history</h2>
          <div className="mt-4 space-y-3">
            {history.length ? (
              history.map((item) => (
                <div key={item.id} className="rounded-md bg-white/[0.05] p-3">
                  <p className="text-sm font-medium">{item.user_input}</p>
                  <p className="text-xs text-zinc-500">{item.primary_mood} • {item.secondary_mood}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-400">Searches appear after generation.</p>
            )}
          </div>
        </Card>
      </aside>
    </div>
  );
}
