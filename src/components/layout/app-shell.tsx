"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Music2, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/playlist", label: "Playlist" },
  { href: "/dashboard", label: "Dashboard" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-emerald-400 text-zinc-950">
              <Music2 size={21} />
            </span>
            <span className="text-base font-black tracking-tight sm:text-lg">Moodify AI</span>
          </Link>
          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium text-zinc-400 transition hover:text-white",
                  pathname === item.href && "bg-white/10 text-white",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Button
            aria-label="Toggle theme"
            variant="secondary"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="hidden size-4 dark:block" />
            <Moon className="size-4 dark:hidden" />
          </Button>
        </div>
      </header>
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {children}
      </motion.main>
      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-4 rounded-full border border-white/10 bg-zinc-950/90 p-1 backdrop-blur md:hidden">
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className={cn("rounded-full px-2 py-3 text-center text-xs text-zinc-400", pathname === item.href && "bg-white/10 text-white")}>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
