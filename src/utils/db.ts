import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { type Activity, type Athlete, type Gear, type AuthTokens } from '../types';

interface StravaDB extends DBSchema {
  activities: {
    key: number;
    value: Activity;
    indexes: { 'by-date': string };
  };
  athlete: {
    key: string;
    value: Athlete;
  };
  gear: {
    key: string;
    value: Gear;
  };
  auth: {
    key: string;
    value: AuthTokens;
  };
  meta: {
    key: string;
    value: { lastSync: string };
  };
}

const DB_NAME = 'straviz-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<StravaDB>> | null = null;

export async function getDB(): Promise<IDBPDatabase<StravaDB>> {
  if (!dbPromise) {
    dbPromise = openDB<StravaDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('activities')) {
          const activityStore = db.createObjectStore('activities', { keyPath: 'id' });
          activityStore.createIndex('by-date', 'start_date_local');
        }
        if (!db.objectStoreNames.contains('athlete')) {
          db.createObjectStore('athlete');
        }
        if (!db.objectStoreNames.contains('gear')) {
          db.createObjectStore('gear', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('auth')) {
          db.createObjectStore('auth');
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta');
        }
      },
    });
  }
  return dbPromise;
}

// Activities
export async function saveActivities(activities: Activity[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('activities', 'readwrite');
  await Promise.all([
    ...activities.map((activity) => tx.store.put(activity)),
    tx.done,
  ]);
}

export async function getActivities(): Promise<Activity[]> {
  const db = await getDB();
  return db.getAllFromIndex('activities', 'by-date');
}

export async function clearActivities(): Promise<void> {
  const db = await getDB();
  await db.clear('activities');
}

// Athlete
export async function saveAthlete(athlete: Athlete): Promise<void> {
  const db = await getDB();
  await db.put('athlete', athlete, 'current');
}

export async function getAthlete(): Promise<Athlete | undefined> {
  const db = await getDB();
  return db.get('athlete', 'current');
}

// Gear
export async function saveGear(gear: Gear[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('gear', 'readwrite');
  await Promise.all([
    ...gear.map((g) => tx.store.put(g)),
    tx.done,
  ]);
}

export async function getGear(): Promise<Gear[]> {
  const db = await getDB();
  return db.getAll('gear');
}

// Auth
export async function saveAuthTokens(tokens: AuthTokens): Promise<void> {
  const db = await getDB();
  await db.put('auth', tokens, 'tokens');
}

export async function getAuthTokens(): Promise<AuthTokens | undefined> {
  const db = await getDB();
  return db.get('auth', 'tokens');
}

export async function clearAuthTokens(): Promise<void> {
  const db = await getDB();
  await db.delete('auth', 'tokens');
}

// Meta
export async function saveLastSync(date: string): Promise<void> {
  const db = await getDB();
  await db.put('meta', { lastSync: date }, 'sync');
}

export async function getLastSync(): Promise<string | null> {
  const db = await getDB();
  const meta = await db.get('meta', 'sync');
  return meta?.lastSync ?? null;
}

// Clear all data
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await Promise.all([
    db.clear('activities'),
    db.clear('athlete'),
    db.clear('gear'),
    db.clear('auth'),
    db.clear('meta'),
  ]);
}
