import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // In many dev workflows these will be present; guard to avoid runtime crash.
  console.warn("[Supabase] NEXT_PUBLIC_SUPABASE_URL or ANON_KEY not configured");
}

export const supabase = createClient(url ?? "", anon ?? "", {
  auth: { persistSession: true, detectSessionInUrl: true },
});

export default supabase;
