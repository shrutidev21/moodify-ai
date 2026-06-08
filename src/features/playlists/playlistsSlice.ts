import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { fetchPlaylists as fetchPlaylistsService } from "@/features/playlists/playlistsService";
import type { Playlist } from "@/types/music";

interface FetchPlaylistsPayload {
  items: Playlist[];
  total: number;
}

type PlaylistsState = {
  items: Playlist[];
  loading: boolean;
  error?: string | null;
  page: number;
  pageSize: number;
  total: number;
};

const initialState: PlaylistsState = { items: [], loading: false, error: null, page: 1, pageSize: 10, total: 0 };

export const fetchPlaylists = createAsyncThunk("playlists/fetch", async ({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number }) => {
  return await fetchPlaylistsService(page, pageSize);
});

const slice = createSlice({
  name: "playlists",
  initialState,
  reducers: {
    addPlaylist(state, action: PayloadAction<Playlist>) {
      state.items = [action.payload, ...state.items.filter((i) => i.id !== action.payload.id)].slice(0, 10);
    },
  },
  extraReducers(builder) {
    builder.addCase(fetchPlaylists.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPlaylists.fulfilled, (state, action: PayloadAction<FetchPlaylistsPayload>) => {
      state.loading = false;
      state.items = action.payload.items;
      state.total = action.payload.total;
    });
    builder.addCase(fetchPlaylists.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error?.message ?? "Failed to load playlists";
    });
  },
});

export const { addPlaylist } = slice.actions;
export default slice.reducer;
