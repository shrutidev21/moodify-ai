"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { LogIn, Mail, User as UserIcon } from "lucide-react";
import { getSession, signOut } from "@/features/auth/authService";
import { useAuthReady } from "@/lib/hooks/useSessionGuard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/utils";

interface ProfileResponse {
  id?: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  error?: string;
}

export default function ProfilePage() {
  const { ready, isAuthenticated } = useAuthReady();
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openAuth(mode: "signin" | "signup") {
    const params = new URLSearchParams();
    params.set("auth", mode);
    params.set("from", pathname);
    router.replace(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    if (!ready || !isAuthenticated) return;

    let mounted = true;

    getSession().then(async (session) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (!currentUser) return;

      const res = await fetch(`/api/auth/get-profile?userId=${currentUser.id}`);
      if (!res.ok) return;

      const profileData = (await res.json()) as ProfileResponse;
      if (!mounted) return;

      setProfile(profileData);
      setFullName(profileData?.full_name ?? currentUser.user_metadata?.full_name ?? "");
      setAvatarUrl(profileData?.avatar_url ?? currentUser.user_metadata?.avatar_url ?? "");
    });

    return () => {
      mounted = false;
    };
  }, [ready, isAuthenticated]);

  async function onSaveProfile() {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, full_name: fullName, avatar_url: avatarUrl, email: user.email }),
      });
      if (!res.ok) {
        const data = (await res.json()) as Pick<ProfileResponse, "error">;
        throw new Error(data?.error ?? "Unable to save profile");
      }
      const updated = (await res.json()) as ProfileResponse;
      setProfile(updated);
      setSaveMessage("Profile saved successfully.");
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-center text-zinc-400">Loading profile…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Profile</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Your Moodify account</h1>
          <p className="mx-auto mt-4 max-w-lg text-zinc-400">
            Sign in to manage your display name, avatar, saved playlists, and listening history.
          </p>
        </motion.div>
        <Card className="mx-auto mt-10 max-w-md p-8 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
            <UserIcon className="size-8" />
          </div>
          <h2 className="mt-5 text-xl font-bold">You are not signed in</h2>
          <p className="mt-2 text-sm text-zinc-400">Create a free account or sign in to open your profile page.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => openAuth("signin")} className="gap-2">
              <LogIn className="size-4" />
              Sign in
            </Button>
            <Button variant="secondary" onClick={() => openAuth("signup")}>
              Create account
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const displayName = fullName || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Moodify listener";
  const avatar = avatarUrl || user?.user_metadata?.avatar_url || "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Profile</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">Your profile</h1>
        </div>
        <Button
          variant="secondary"
          onClick={async () => {
            await signOut();
            window.location.href = "/";
          }}
        >
          Sign out
        </Button>
      </motion.div>

      <Card className="overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt={displayName} className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center text-3xl font-black text-emerald-300">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-black">{displayName}</h2>
            <p className="mt-1 inline-flex items-center gap-2 text-sm text-zinc-400">
              <Mail className="size-4" />
              {user?.email ?? "—"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm text-zinc-300">
            Full name
            <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" autoComplete="name" />
          </label>
          <label className="grid gap-2 text-sm text-zinc-300">
            Avatar URL
            <Input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://..." />
          </label>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button onClick={onSaveProfile} disabled={saving}>
              {saving ? "Saving..." : "Save profile"}
            </Button>
            {saveMessage && <span className="text-sm text-emerald-300">{saveMessage}</span>}
            {error && <span className="text-sm text-rose-300">{error}</span>}
          </div>
        </div>

        {profile && (
          <p className="mt-6 text-xs text-zinc-500">
            Member since profile sync · ID {profile.id ?? user?.id}
          </p>
        )}
      </Card>
    </div>
  );
}
