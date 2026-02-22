import axios, { type AxiosInstance, AxiosError } from 'axios';
import type { Activity, Athlete, TokenResponse } from '../types';
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
} from '../utils/pkce';
import {
  saveCodeVerifier,
  getCodeVerifier,
  clearCodeVerifier,
  saveOAuthState,
  getOAuthState,
  clearOAuthState,
  saveAuth,
} from '../utils/storage';
import { store } from '../store/store';
import { setTokens, logout } from '../store/slices/authSlice';

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API_URL = 'https://www.strava.com/api/v3';

const CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_STRAVA_CLIENT_SECRET;
const REDIRECT_URI = import.meta.env.VITE_STRAVA_REDIRECT_URI;

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: STRAVA_API_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const state = store.getState();
    let accessToken = state.auth.accessToken;
    const expiresAt = state.auth.expiresAt;

    // Check if token is expired or about to expire (within 5 minutes)
    if (expiresAt && Date.now() / 1000 > expiresAt - 300) {
      const refreshToken = state.auth.refreshToken;
      if (refreshToken) {
        try {
          const newTokens = await refreshAccessToken(refreshToken);
          accessToken = newTokens.access_token;
        } catch (error) {
          store.dispatch(logout());
          throw error;
        }
      }
    }

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

// OAuth Functions
export async function authorize(): Promise<void> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  saveOAuthState(state);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'read,activity:read_all,profile:read_all',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  window.location.href = `${STRAVA_AUTH_URL}?${params.toString()}`;
}

export async function exchangeToken(code: string): Promise<TokenResponse> {

  try {
    const response = await axios.post<TokenResponse>(STRAVA_TOKEN_URL, {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    });

    // Clear PKCE data
    clearCodeVerifier();
    clearOAuthState();

    // Save tokens
    await saveAuth({
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: response.data.expires_at,
    });

    // Update Redux store
    store.dispatch(
      setTokens({
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: response.data.expires_at,
        athlete: response.data.athlete,
      })
    );

    return response.data;
  } catch (error) {
    clearCodeVerifier();
    clearOAuthState();
    throw error;
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const response = await axios.post<TokenResponse>(STRAVA_TOKEN_URL, {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  // Save new tokens
  await saveAuth({
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
    expiresAt: response.data.expires_at,
  });

  // Update Redux store
  store.dispatch(
    setTokens({
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: response.data.expires_at,
      athlete: response.data.athlete,
    })
  );

  return response.data;
}

// API Functions
export async function fetchAthlete(): Promise<Athlete> {
  const response = await api.get<Athlete>('/athlete');
  return response.data;
}

export async function fetchActivities(
  page: number = 1,
  perPage: number = 100,
  before?: number,
  after?: number
): Promise<Activity[]> {
  const params: Record<string, number> = {
    page,
    per_page: perPage,
  };

  if (before) params.before = before;
  if (after) params.after = after;

  const response = await api.get<Activity[]>('/athlete/activities', { params });
  return response.data;
}

export async function fetchAllActivities(
  onProgress?: (loaded: number) => void
): Promise<Activity[]> {
  const allActivities: Activity[] = [];
  let page = 1;
  const perPage = 100;
  let hasMore = true;

  while (hasMore) {
    const activities = await fetchActivities(page, perPage);
    allActivities.push(...activities);

    if (onProgress) {
      onProgress(allActivities.length);
    }

    if (activities.length < perPage) {
      hasMore = false;
    } else {
      page++;
    }

    // Rate limiting - wait 100ms between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return allActivities;
}

export async function fetchNewActivities(after: number): Promise<Activity[]> {
  const allActivities: Activity[] = [];
  let page = 1;
  const perPage = 100;
  let hasMore = true;

  while (hasMore) {
    const activities = await fetchActivities(page, perPage, undefined, after);
    allActivities.push(...activities);

    if (activities.length < perPage) {
      hasMore = false;
    } else {
      page++;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return allActivities;
}

// Alias for backward compatibility
export const redirectToStravaAuthorize = authorize;

export { api };
