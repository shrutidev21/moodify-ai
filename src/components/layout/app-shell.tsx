"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
  History,
  ListMusic,
  LogIn,
  LogOut,
  Moon,
  Music2,
  Radio,
  Save,
  Sun,
  User,
  WandSparkles,
} from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearUser } from "@/features/auth/authSlice";
import { signOut } from "@/features/auth/authService";
import { AuthModal } from "@/components/auth/auth-modal";

const nav = [
  { href: "/", label: "Home", icon: Radio },
  { href: "/discover", label: "Discover", icon: WandSparkles },
  { href: "/playlist", label: "Playlist", icon: ListMusic },
  { href: "/playlists", label: "Saved", icon: Save },
  { href: "/history", label: "History", icon: History },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const user = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const authParam = searchParams.get("auth");
  const authMode = !user.id && (authParam === "signup" || authParam === "signin") ? authParam : null;

  async function handleSignOut() {
    await signOut();
    dispatch(clearUser());
    router.push("/");
  }

  function isActive(href: string) {
    return href === "/" ? pathname === href : pathname.startsWith(href);
  }

  function setAuthMode(mode: "signin" | "signup" | null) {
    const params = new URLSearchParams(searchParams.toString());

    if (mode) {
      params.set("auth", mode);
      if (!params.get("from")) {
        params.set("from", pathname);
      }
    } else {
      params.delete("auth");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="min-h-screen text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/85 shadow-lg shadow-black/20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-950/30">
              <Music2 size={21} />
            </span>
            <span className="truncate text-base font-black sm:text-lg">Moodify AI</span>
          </Link>
          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 lg:flex">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.06] hover:text-white xl:px-4",
                    active && "bg-white/10 text-white",
                )}
              >
                  <Icon className="size-4" />
                {item.label}
              </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/profile"
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition sm:px-4",
                pathname.startsWith("/profile")
                  ? "border-emerald-400/40 bg-emerald-400/10 text-white"
                  : "border-white/10 bg-white/10 text-white hover:bg-white/15",
              )}
            >
              <User className="size-4" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
            {user.id ? (
              <Button variant="secondary" size="icon" onClick={handleSignOut} aria-label="Sign out">
                <LogOut className="size-4" />
              </Button>
            ) : (
              <>
                <Button variant="secondary" size="sm" onClick={() => setAuthMode("signin")} className="hidden sm:inline-flex">
                  <LogIn className="size-4" />
                  Sign in
                </Button>
                <Button size="sm" onClick={() => setAuthMode("signup")} className="hidden min-[420px]:inline-flex">
                  Sign up
                </Button>
              </>
            )}
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
        </div>
      </header>
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="pb-24 lg:pb-0"
      >
        {children}
      </motion.main>
      <AuthModal mode={authMode} onModeChange={setAuthMode} />
      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-6 gap-1 rounded-full border border-white/10 bg-zinc-950/90 p-1 shadow-2xl shadow-black/35 backdrop-blur-xl lg:hidden">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
          <Link
            key={item.href}
            href={item.href}
              className={cn(
                "grid min-h-14 place-items-center gap-0.5 rounded-full px-1 py-2 text-[11px] font-medium text-zinc-400 transition hover:text-white",
                active && "bg-white/10 text-white",
              )}
          >
              <Icon className="size-4" />
              <span className="max-w-full truncate">{item.label}</span>
          </Link>
          );
        })}
      </nav>
    </div>
  );
}
