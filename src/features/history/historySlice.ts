import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SearchHistoryItem } from "@/types/music";

type HistoryState = {
  items: SearchHistoryItem[];
};

const initialState: HistoryState = { items: [] };

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    addSearch(state, action: PayloadAction<SearchHistoryItem>) {
      state.items = [action.payload, ...state.items.filter((item) => item.prompt !== action.payload.prompt)].slice(0, 10);
    },
  },
});

export const { addSearch } = historySlice.actions;
export default historySlice.reducer;
