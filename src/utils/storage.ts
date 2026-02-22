import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Activity, Athlete } from '../types';

interface StravizDB extends DBSchema {
  auth: {
    key: string;
    value: {
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
    };
  };
  athlete: {
    key: string;
    value: Athlete;
  };
  activities: {
    key: number;
    value: Activity;
    indexes: { 'by-date': string };
  };
  settings: {
    key: string;
    value: string | number;
  };
  sync: {
    key: string;
    value: number;
  };
}

const DB_NAME = 'straviz-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<StravizDB>> | null = null;

async function getDB(): Promise<IDBPDatabase<StravizDB>> {
  if (!dbPromise) {
    dbPromise = openDB<StravizDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('auth')) {
          db.createObjectStore('auth');
        }
        if (!db.objectStoreNames.contains('athlete')) {
          db.createObjectStore('athlete');
        }
        if (!db.objectStoreNames.contains('activities')) {
          const activityStore = db.createObjectStore('activities', { keyPath: 'id' });
          activityStore.createIndex('by-date', 'start_date');
        }
        if (!db.objectStoreNames.contains('gear')) {
          db.createObjectStore('gear', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        if (!db.objectStoreNames.contains('sync')) {
          db.createObjectStore('sync');
        }
      },
    });
  }
  return dbPromise;
}

// PKCE Storage (using sessionStorage for security)
export function clearCodeVerifier(): void {
  sessionStorage.removeItem('pkce_code_verifier');
}

export function saveOAuthState(state: string): void {
  sessionStorage.setItem('oauth_state', state);
}

export function clearOAuthState(): void {
  sessionStorage.removeItem('oauth_state');
}

// Auth Storage
export async function saveAuth(auth: {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}): Promise<void> {
  const db = await getDB();
  await db.put('auth', auth, 'tokens');
}

export async function getAuth(): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
} | null> {
  const db = await getDB();
  return (await db.get('auth', 'tokens')) || null;
}

export async function clearAuth(): Promise<void> {
  const db = await getDB();
  await db.delete('auth', 'tokens');
}

// Athlete Storage
export async function saveAthlete(athlete: Athlete): Promise<void> {
  const db = await getDB();
  await db.put('athlete', athlete, 'current');
}

export async function getAthleteFromStorage(): Promise<Athlete | null> {
  const db = await getDB();
  return (await db.get('athlete', 'current')) || null;
}

// Activities Storage
export async function saveActivities(activities: Activity[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('activities', 'readwrite');
  await tx.store.clear();
  for (const activity of activities) {
    tx.store.put(activity);
  }
  await tx.done;
}

export async function getActivitiesFromStorage(): Promise<Activity[]> {
  const db = await getDB();
  return db.getAll('activities');
}

export async function clearActivities(): Promise<void> {
  const db = await getDB();
  await db.clear('activities');
}

// Sync Storage
export async function saveLastSync(timestamp: number): Promise<void> {
  const db = await getDB();
  await db.put('sync', timestamp, 'lastSync');
}

export async function getLastSync(): Promise<number | null> {
  const db = await getDB();
  return (await db.get('sync', 'lastSync')) || null;
}

// Clear all data
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await Promise.all([
    db.clear('auth'),
    db.clear('athlete'),
    db.clear('activities'),
    db.clear('gear'),
    db.clear('settings'),
    db.clear('sync'),
  ]);
}
