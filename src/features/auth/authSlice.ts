import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type UserState = {
  id?: string | null;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  loading: boolean;
  error?: string | null;
};

const initialState: UserState = {
  id: null,
  email: null,
  full_name: null,
  avatar_url: null,
  loading: false,
  error: null,
};

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<Partial<UserState>>) {
      Object.assign(state, action.payload, { loading: false, error: null });
    },
    clearUser(state) {
      state.id = null;
      state.email = null;
      state.full_name = null;
      state.avatar_url = null;
      state.loading = false;
      state.error = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setUser, clearUser, setLoading, setError } = slice.actions;
export default slice.reducer;
