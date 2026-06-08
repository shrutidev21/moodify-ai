import { createClient } from "@supabase/supabase-js";

const tablesToCheck = ["profiles", "users", "playlists", "mood_history", "ai_analysis_cache"];

export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn(
      "[Supabase] DB connection check skipped: missing NEXT_PUBLIC_SUPABASE_URL or Supabase key."
    );
    return;
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  });

  console.log("[Supabase] Checking DB connection on server start...");

  for (const table of tablesToCheck) {
    const { error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (!error) {
      console.log(`[Supabase] DB connected. Table "${table}" is reachable.`);
      return;
    }

    if (error.message.includes("Could not find the table")) {
      console.warn(`[Supabase] Table "${table}" not found while checking DB.`);
      continue;
    }

    console.error(`[Supabase] DB connection check failed: ${error.message}`);
    return;
  }

  console.error("[Supabase] DB connection check failed: no checked tables were reachable.");
}
