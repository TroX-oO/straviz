import axios from 'axios';
import type { TokenResponse } from '../types';
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
} from '../utils/pkce';
import {
  clearCodeVerifier,
  saveOAuthState,
  clearOAuthState,
  saveAuth,
} from '../utils/storage';
import { store } from '../store/store';
import { setTokens } from '../store/slices/authSlice';

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_STRAVA_CLIENT_SECRET;
const REDIRECT_URI = import.meta.env.VITE_STRAVA_REDIRECT_URI;


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
