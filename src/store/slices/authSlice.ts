import { createSlice, type PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import type { AuthState, Athlete } from '../../types';
import {
  getAuth,
  clearAuth,
  clearAllData,
  getAthleteFromStorage,
  saveAthlete,
} from '../../utils/storage';

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  athlete: null,
  isAuthenticated: false,
  isLoading: true,
};

const initializeAuth = createAsyncThunk('auth/initialize', async () => {
  const auth = await getAuth();
  const athlete = await getAthleteFromStorage();

  if (auth && auth.expiresAt > Date.now() / 1000) {
    return {
      ...auth,
      athlete,
      isAuthenticated: true,
    };
  }

  return null;
});

const logoutAsync = createAsyncThunk('auth/logoutAsync', async () => {
  await clearAllData();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
        expiresAt: number;
        athlete?: Athlete;
      }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.expiresAt = action.payload.expiresAt;
      state.isAuthenticated = true;
      state.isLoading = false;
      if (action.payload.athlete) {
        state.athlete = action.payload.athlete;
        saveAthlete(action.payload.athlete);
      }
    },
    setAthlete: (state, action: PayloadAction<Athlete>) => {
      state.athlete = action.payload;
      saveAthlete(action.payload);
    },
    logout: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.expiresAt = null;
      state.athlete = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      clearAuth();
    },
    refreshTokenSuccess: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
        expiresAt: number;
      }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.expiresAt = action.payload.expiresAt;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.expiresAt = action.payload.expiresAt;
          state.athlete = action.payload.athlete;
          state.isAuthenticated = action.payload.isAuthenticated;
        }
        state.isLoading = false;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.accessToken = null;
        state.refreshToken = null;
        state.expiresAt = null;
        state.athlete = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      });
  },
});

export const { setTokens, logout } =
  authSlice.actions;
export default authSlice.reducer;
