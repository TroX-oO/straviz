
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

type Units = 'metric' | 'imperial';
type Theme = 'light' | 'dark';

interface SettingsState {
  units: Units;
  theme: Theme;
}

const initialState: SettingsState = {
  units: 'metric',
  theme: 'light',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setUnits: (state, action: PayloadAction<Units>) => {
      state.units = action.payload;
    },
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    },
  },
});

export const { setUnits, setTheme } = settingsSlice.actions;

export const selectUnits = (state: RootState) => state.settings.units;
export const selectTheme = (state: RootState) => state.settings.theme;

export default settingsSlice.reducer;
