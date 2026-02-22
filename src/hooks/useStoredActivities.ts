import { useState, useCallback } from 'react';
import type { Activity } from '../types';
import { getActivitiesFromStorage } from '../utils/storage';

export function useStoredActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getActivitiesFromStorage();
      // Tri par date décroissante par défaut
      data.sort(
        (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );
      setActivities(data);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }, []);

  return { activities, loading, loaded, load };
}
