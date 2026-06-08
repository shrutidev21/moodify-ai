import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(fileName) {
  const envPath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("[Supabase] Missing env configuration.");
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL");
  console.error("Required: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

const tablesToCheck = ["profiles", "users", "playlists", "mood_history"];

console.log("[Supabase] Checking connection...");
console.log(`[Supabase] URL: ${url}`);
console.log(
  `[Supabase] Key: ${
    process.env.SUPABASE_SERVICE_ROLE_KEY ? "service role" : "anon"
  }`
);

let connected = false;

for (const table of tablesToCheck) {
  const { error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  if (!error) {
    connected = true;
    console.log(`[Supabase] OK: table "${table}" is reachable.`);
    continue;
  }

  if (error.message.includes("Could not find the table")) {
    console.warn(`[Supabase] Missing table: "${table}".`);
    continue;
  }

  console.error(`[Supabase] Error on table "${table}": ${error.message}`);
}

if (!connected) {
  console.error("[Supabase] Could not confirm DB connectivity from the checked tables.");
  process.exit(1);
}

console.log("[Supabase] DB connection confirmed.");
