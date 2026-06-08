import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Playlist, Song } from "@/types/music";

type PlaylistState = {
  current: Playlist | null;
  activeSong: Song | null;
  savedIds: string[];
  selectedSongIds: string[];
};

const initialState: PlaylistState = {
  current: null,
  activeSong: null,
  savedIds: [],
  selectedSongIds: [],
};

const playlistSlice = createSlice({
  name: "playlist",
  initialState,
  reducers: {
    setCurrentPlaylist(state, action: PayloadAction<Playlist>) {
      state.current = action.payload;
      state.activeSong = action.payload.songs[0] ?? null;
      // Songs are not selected for saving until the user marks them.
      state.selectedSongIds = [];
    },
    setActiveSong(state, action: PayloadAction<Song>) {
      state.activeSong = action.payload;
    },
    markPlaylistSaved(state, action: PayloadAction<string>) {
      if (!state.savedIds.includes(action.payload)) state.savedIds.push(action.payload);
    },
    toggleSongSaved(state, action: PayloadAction<string>) {
      if (state.selectedSongIds.includes(action.payload)) {
        state.selectedSongIds = state.selectedSongIds.filter((id) => id !== action.payload);
      } else {
        state.selectedSongIds.push(action.payload);
      }
    },
  },
});

export const { setCurrentPlaylist, setActiveSong, markPlaylistSaved, toggleSongSaved } = playlistSlice.actions;
export default playlistSlice.reducer;
