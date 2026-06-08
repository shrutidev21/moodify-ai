import { supabase } from "@/lib/supabase/client";
import type { MoodHistoryItem } from "@/features/history/historySlice";

export async function fetchHistory(page = 1, pageSize = 10): Promise<{ items: MoodHistoryItem[]; total: number }> {
  const from = (page - 1) * pageSize;
  const to = page * pageSize - 1;
  const resp = await supabase.from("mood_history").select("*, recommended_songs").order("created_at", { ascending: false }).range(from, to);
  if (resp.error) {
    const msg = String(resp.error.message ?? "");
    if (msg.includes("Could not find the table")) {
      // Supabase schema missing — return empty but allow client-side optimistic items to remain
      return { items: [], total: 0 };
    }
    throw resp.error;
  }
  return { items: resp.data ?? [], total: resp.count ?? 0 };
}
