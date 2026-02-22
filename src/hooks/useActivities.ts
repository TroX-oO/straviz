import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import type { Activity } from '../types';

interface UseActivitiesReturn {
  activities: Activity[];
  totalActivities: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useActivities = (page: number = 1, perPage: number = 30): UseActivitiesReturn => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const fetchActivities = useCallback(async () => {
    console.log(`Fetching activities - Page: ${page}, Per Page: ${perPage}`);
    setLoading(true);
    setError(null);

    try {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token expired or invalid');
        }
        throw new Error('Failed to fetch activities');
      }

      const data = await response.json();
      setActivities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, accessToken]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);
  return {
    activities,
    totalActivities: activities.length,
    loading,
    error,
    refetch: fetchActivities,
  };
};


