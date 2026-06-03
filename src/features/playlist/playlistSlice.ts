import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Playlist, Song } from "@/types/music";

type PlaylistState = {
  current: Playlist | null;
  activeSong: Song | null;
  savedIds: string[];
};

const initialState: PlaylistState = {
  current: null,
  activeSong: null,
  savedIds: [],
};

const playlistSlice = createSlice({
  name: "playlist",
  initialState,
  reducers: {
    setCurrentPlaylist(state, action: PayloadAction<Playlist>) {
      state.current = action.payload;
      state.activeSong = action.payload.songs[0] ?? null;
    },
    setActiveSong(state, action: PayloadAction<Song>) {
      state.activeSong = action.payload;
    },
    markPlaylistSaved(state, action: PayloadAction<string>) {
      if (!state.savedIds.includes(action.payload)) state.savedIds.push(action.payload);
    },
  },
});

export const { setCurrentPlaylist, setActiveSong, markPlaylistSaved } = playlistSlice.actions;
export default playlistSlice.reducer;
