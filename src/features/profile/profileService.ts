import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function fetchProfile(userId: string) {
  const supabase = createSupabaseAdmin();
  if (!supabase) throw new Error("Supabase admin not configured");

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
}

export async function updateProfile(profile: { id: string; full_name?: string; avatar_url?: string; email?: string }) {
  const supabase = createSupabaseAdmin();
  if (!supabase) throw new Error("Supabase admin not configured");

  const { data, error } = await supabase.from("profiles").upsert(profile, { onConflict: "id" }).select("*").single();
  if (error) throw error;
  return data;
}
