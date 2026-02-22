export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

export function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

function base64UrlEncode(array: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...array));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function storeCodeVerifier(verifier: string): void {
  sessionStorage.setItem('pkce_code_verifier', verifier);
}

export function getCodeVerifier(): string | null {
  return sessionStorage.getItem('pkce_code_verifier');
}

export function clearCodeVerifier(): void {
  sessionStorage.removeItem('pkce_code_verifier');
}

export function storeState(state: string): void {
  sessionStorage.setItem('oauth_state', state);
}

export function getStoredState(): string | null {
  return sessionStorage.getItem('oauth_state');
}

export function clearState(): void {
  sessionStorage.removeItem('oauth_state');
}
