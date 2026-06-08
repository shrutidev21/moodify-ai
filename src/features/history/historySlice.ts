import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { SearchHistoryItem, Song } from "@/types/music";
import { fetchHistory as fetchHistoryService } from "@/features/history/historyService";

export type MoodHistoryItem = {
  id: string;
  user_id: string | null;
  user_input: string;
  primary_mood: string | null;
  secondary_mood: string | null;
  recommended_songs: Song[];
  created_at: string;
};

type HistoryState = {
  items: MoodHistoryItem[];
  loading: boolean;
  error?: string | null;
  page: number;
  pageSize: number;
  total: number;
};

const initialState: HistoryState = { items: [], loading: false, error: null, page: 1, pageSize: 10, total: 0 };

export const fetchHistory = createAsyncThunk("history/fetch", async ({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number }) => {
  return await fetchHistoryService(page, pageSize);
});

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    addSearch(state, action: PayloadAction<SearchHistoryItem>) {
      state.items = [
        { id: action.payload.id, user_id: null, user_input: action.payload.prompt, primary_mood: "", secondary_mood: "", recommended_songs: [], created_at: action.payload.createdAt },
        ...state.items.filter((item) => item.user_input !== action.payload.prompt),
      ].slice(0, 10);
    },
  },
  extraReducers(builder) {
    builder.addCase(fetchHistory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchHistory.fulfilled, (state, action) => {
      state.loading = false;
      // If server returned items, use them; otherwise preserve optimistic items in state
      state.items = (action.payload.items && action.payload.items.length > 0) ? action.payload.items : state.items;
      state.total = action.payload.total ?? state.total;
    });
    builder.addCase(fetchHistory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error?.message ?? "Failed to load history";
    });
  },
});

export const { addSearch } = historySlice.actions;
export default historySlice.reducer;
