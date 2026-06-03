import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type PreferencesState = {
  defaultLanguage: string;
  highEnergyBias: boolean;
  explicitContent: boolean;
};

const initialState: PreferencesState = {
  defaultLanguage: "Any",
  highEnergyBias: false,
  explicitContent: false,
};

const preferencesSlice = createSlice({
  name: "preferences",
  initialState,
  reducers: {
    setDefaultLanguage(state, action: PayloadAction<string>) {
      state.defaultLanguage = action.payload;
    },
    setHighEnergyBias(state, action: PayloadAction<boolean>) {
      state.highEnergyBias = action.payload;
    },
    setExplicitContent(state, action: PayloadAction<boolean>) {
      state.explicitContent = action.payload;
    },
  },
});

export const { setDefaultLanguage, setHighEnergyBias, setExplicitContent } = preferencesSlice.actions;
export default preferencesSlice.reducer;
