import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import type { Activity } from '../types';
import {
  saveActivities,
  getActivitiesFromStorage,
  saveLastSync,
  getLastSync,
} from '../utils/storage';

export interface YearSummary {
  year: string;
  count: number;
}

export interface SyncStats {
  lastSync: number | null;      // timestamp ms (Date.now())
  totalCached: number;
  activitiesByYear: YearSummary[];
}

function computeByYear(activities: Activity[]): YearSummary[] {
  const map: Record<string, number> = {};
  for (const a of activities) {
    const year = new Date(a.start_date).getFullYear().toString();
    map[year] = (map[year] || 0) + 1;
  }
  return Object.entries(map)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => Number(b.year) - Number(a.year));
}

export function useSync() {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SyncStats>({
    lastSync: null,
    totalCached: 0,
    activitiesByYear: [],
  });

  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const loadStats = useCallback(async () => {
    const [lastSync, activities] = await Promise.all([
      getLastSync(),
      getActivitiesFromStorage(),
    ]);
    setStats({
      lastSync,
      totalCached: activities.length,
      activitiesByYear: computeByYear(activities),
    });
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const sync = useCallback(async () => {
    if (!accessToken || syncing) return;

    setSyncing(true);
    setProgress(0);
    setError(null);

    try {
      const allActivities: Activity[] = [];
      let page = 1;
      const PER_PAGE = 100;

      while (true) {
        const resp = await fetch(
          `https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${PER_PAGE}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (resp.status === 401) {
          throw new Error('Session expirée. Reconnectez-vous.');
        }
        if (!resp.ok) {
          throw new Error(`Erreur API Strava (${resp.status})`);
        }

        const batch: Activity[] = await resp.json();
        if (batch.length === 0) break;

        allActivities.push(...batch);
        setProgress(allActivities.length);

        if (batch.length < PER_PAGE) break;
        page++;

        // Rate limiting — 100 ms entre les requêtes
        await new Promise((r) => setTimeout(r, 100));
      }

      await saveActivities(allActivities);
      const now = Date.now();
      await saveLastSync(now);

      setStats({
        lastSync: now,
        totalCached: allActivities.length,
        activitiesByYear: computeByYear(allActivities),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
      setProgress(0);
    }
  }, [accessToken, syncing]);

  return { syncing, progress, error, stats, sync };
}
