import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { GearState, Gear } from '../../types';

const initialState: GearState = {
  bikes: [],
  shoes: [],
  loading: false,
  error: null,
};

const gearSlice = createSlice({
  name: 'gear',
  initialState,
  reducers: {
    setGear: (
      state,
      action: PayloadAction<{ bikes: Gear[]; shoes: Gear[] }>
    ) => {
      state.bikes = action.payload.bikes;
      state.shoes = action.payload.shoes;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearGear: (state) => {
      state.bikes = [];
      state.shoes = [];
    },
  },
});

export const { setGear, setLoading, setError, clearGear } = gearSlice.actions;
export default gearSlice.reducer;
