import { configureStore } from "@reduxjs/toolkit";
import playlistReducer from "@/features/playlist/playlistSlice";
import historyReducer from "@/features/history/historySlice";
import preferencesReducer from "@/features/preferences/preferencesSlice";
import authReducer from "@/features/auth/authSlice";
import playlistsReducer from "@/features/playlists/playlistsSlice";

export const store = configureStore({
  reducer: {
    playlist: playlistReducer,
    history: historyReducer,
    preferences: preferencesReducer,
    auth: authReducer,
    playlists: playlistsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
