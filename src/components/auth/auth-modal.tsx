"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn, signUp } from "@/features/auth/authService";
import { setUser } from "@/features/auth/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { getErrorMessage } from "@/lib/utils";

type AuthMode = "signin" | "signup";

interface AuthModalProps {
  mode: AuthMode | null;
  onModeChange: (mode: AuthMode | null) => void;
}

export function AuthModal({ mode, onModeChange }: AuthModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isOpen = mode !== null;
  const title = mode === "signup" ? "Create account" : "Sign in";
  const submitLabel = mode === "signup" ? "Create account" : "Sign in";
  const loadingLabel = mode === "signup" ? "Creating..." : "Signing in...";

  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setMessage(null);
  }, [isOpen, mode]);

  function closeModal() {
    onModeChange(null);
  }

  function switchMode(nextMode: AuthMode) {
    setError(null);
    setMessage(null);
    onModeChange(nextMode);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mode) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const data =
        mode === "signup"
          ? await signUp({ email, password, full_name: fullName })
          : await signIn(email, password);

      const user = data.session?.user ?? null;
      if (!user && mode === "signup") {
        setMessage("Account created. Please confirm your email, then sign in.");
        return;
      }

      if (user) {
        dispatch(
          setUser({
            id: user.id,
            email: user.email ?? null,
            full_name: user.user_metadata?.full_name ?? (fullName || null),
            avatar_url: user.user_metadata?.avatar_url ?? null,
          }),
        );
      }

      closeModal();

      const from = searchParams.get("from");
      if (from && from.startsWith("/")) {
        router.replace(from);
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err) || "Authentication failed";
      setError(message.includes("Email not confirmed") ? "Please confirm your email first, then sign in." : message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-white/10 bg-zinc-950 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 id="auth-modal-title" className="text-xl font-black text-white">{title}</h2>
            <p className="mt-1 text-sm text-zinc-400">Continue to save playlists, history, and profile details.</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={closeModal} aria-label="Close auth modal">
            <X className="size-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-1 border-b border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${mode === "signin" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${mode === "signup" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"}`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4 p-5">
          {mode === "signup" && (
            <label className="grid gap-2">
              <span className="text-sm font-medium text-zinc-300">Full name</span>
              <span className="relative block">
                <User className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <Input className="pl-11" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Shruti Sharma" autoComplete="name" />
              </span>
            </label>
          )}

          <label className="grid gap-2">
            <span className="text-sm font-medium text-zinc-300">Email</span>
            <span className="relative block">
              <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <Input className="pl-11" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" type="email" autoComplete="email" required />
            </span>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-zinc-300">Password</span>
            <span className="relative block">
              <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <Input
                className="px-11"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </span>
          </label>

          {error && <p className="rounded-md border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
          {message && <p className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">{message}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? loadingLabel : submitLabel}
          </Button>

          <button
            type="button"
            onClick={() => switchMode(mode === "signup" ? "signin" : "signup")}
            className="text-center text-sm font-medium text-zinc-400 transition hover:text-white"
          >
            {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
        </form>
      </div>
    </div>
  );
}
