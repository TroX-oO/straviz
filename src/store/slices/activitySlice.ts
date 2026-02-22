import { createSlice, type PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { Activity, ActivityState } from '../../types';
import {
  saveActivities,
  getActivitiesFromStorage,
  clearActivities as clearActivitiesStorage,
  saveLastSync,
  getLastSync,
} from '../../utils/storage';

const initialState: ActivityState = {
  activities: [],
  loading: false,
  lastSync: null,
  error: null,
};

export const loadActivitiesFromStorage = createAsyncThunk(
  'activities/loadFromStorage',
  async () => {
    const activities = await getActivitiesFromStorage();
    const lastSync = await getLastSync();
    return { activities, lastSync };
  }
);

const activitySlice = createSlice({
  name: 'activities',
  initialState,
  reducers: {
    setActivities: (state, action: PayloadAction<Activity[]>) => {
      state.activities = action.payload;
      state.lastSync = Date.now();
      saveActivities(action.payload);
      saveLastSync(Date.now());
    },
    addActivities: (state, action: PayloadAction<Activity[]>) => {
      const existingIds = new Set(state.activities.map((a) => a.id));
      const newActivities = action.payload.filter((a) => !existingIds.has(a.id));
      state.activities = [...newActivities, ...state.activities].sort(
        (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );
      state.lastSync = Date.now();
      saveActivities(state.activities);
      saveLastSync(Date.now());
    },
    clearActivities: (state) => {
      state.activities = [];
      state.lastSync = null;
      clearActivitiesStorage();
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadActivitiesFromStorage.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadActivitiesFromStorage.fulfilled, (state, action) => {
        state.activities = action.payload.activities.sort(
          (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        );
        state.lastSync = action.payload.lastSync;
        state.loading = false;
      })
      .addCase(loadActivitiesFromStorage.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { setActivities, addActivities, clearActivities, setLoading, setError } =
  activitySlice.actions;

export const selectAllActivities = (state: RootState) => state.activities.activities;
export const selectActivitiesLoading = (state: RootState) => state.activities.loading;
export const selectLastSync = (state: RootState) => state.activities.lastSync;

export default activitySlice.reducer;
