import { configureStore } from "@reduxjs/toolkit";
import playlistReducer from "@/features/playlist/playlistSlice";
import historyReducer from "@/features/history/historySlice";
import preferencesReducer from "@/features/preferences/preferencesSlice";

export const store = configureStore({
  reducer: {
    playlist: playlistReducer,
    history: historyReducer,
    preferences: preferencesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
