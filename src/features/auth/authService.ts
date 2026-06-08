import supabase from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

type SignUpPayload = { email: string; password: string; full_name?: string; avatar_url?: string };

async function createProfile(payload: { id: string; email: string; full_name?: string | null; avatar_url?: string | null }) {
  const response = await fetch("/api/auth/create-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.error ?? "Profile creation failed");
  }
}

export async function signUp(payload: SignUpPayload) {
  const { email, password, full_name, avatar_url } = payload;
  const displayName = full_name?.trim() || email.split("@")[0] || "Moodify user";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: displayName,
        avatar_url,
      },
    },
  });
  if (error) throw error;

  const user = data.user;
  if (user && data.session) {
    await createProfile({ id: user.id, email, full_name: displayName, avatar_url });
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const user = data.user;
  if (user?.email) {
    await createProfile({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name ?? user.email.split("@")[0],
      avatar_url: user.user_metadata?.avatar_url,
    });
  }
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export function onAuthStateChange(cb: (event: string, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => cb(event, session));
}
