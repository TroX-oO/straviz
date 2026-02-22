import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

export interface Activity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  start_date_local: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  kilojoules?: number;
  suffer_score?: number;
}

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

  const fetchActivities = async () => {
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
  };

  useEffect(() => {
    fetchActivities();
    console.log('Activities fetched:', activities.length);
  }, [page, perPage, accessToken]);
  return {
    activities,
    totalActivities: activities.length,
    loading,
    error,
    refetch: fetchActivities,
  };
};

export default useActivities;
