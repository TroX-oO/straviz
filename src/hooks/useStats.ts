import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

export interface TotalStats {
  totalDistance: number;
  totalMovingTime: number;
  totalElevation: number;
  totalActivities: number;
  activeDays: number;
}

export interface MonthlyData {
  month: string;
  distance: number;
  activities: number;
}

export interface ActivityTypeData {
  type: string;
  count: number;
  distance: number;
}

interface UseStatsReturn {
  totalStats: TotalStats;
  monthlyData: MonthlyData[];
  activityTypeData: ActivityTypeData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const defaultTotalStats: TotalStats = {
  totalDistance: 0,
  totalMovingTime: 0,
  totalElevation: 0,
  totalActivities: 0,
  activeDays: 0,
};

export const useStats = (): UseStatsReturn => {
  const [totalStats, setTotalStats] = useState<TotalStats>(defaultTotalStats);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [activityTypeData, setActivityTypeData] = useState<ActivityTypeData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      // Fetch athlete info
      const athleteResponse = await fetch('https://www.strava.com/api/v3/athlete', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!athleteResponse.ok) throw new Error('Failed to fetch athlete');
      const athlete = await athleteResponse.json();

      // Fetch athlete stats
      const statsResponse = await fetch(
        `https://www.strava.com/api/v3/athletes/${athlete.id}/stats`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!statsResponse.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsResponse.json();

      // Fetch recent activities for charts
      const activitiesResponse = await fetch(
        'https://www.strava.com/api/v3/athlete/activities?per_page=200',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const activities = await activitiesResponse.json();

      // Calculate total stats
      const allRide = statsData.all_ride_totals || {};
      const allRun = statsData.all_run_totals || {};
      const allSwim = statsData.all_swim_totals || {};

      // Calculate unique active days
      const uniqueDays = new Set(
        activities.map((a: { start_date: string }) => 
          new Date(a.start_date).toISOString().split('T')[0]
        )
      );

      setTotalStats({
        totalDistance: (allRide.distance || 0) + (allRun.distance || 0) + (allSwim.distance || 0),
        totalMovingTime: (allRide.moving_time || 0) + (allRun.moving_time || 0) + (allSwim.moving_time || 0),
        totalElevation: (allRide.elevation_gain || 0) + (allRun.elevation_gain || 0),
        totalActivities: (allRide.count || 0) + (allRun.count || 0) + (allSwim.count || 0),
        activeDays: uniqueDays.size,
      });

      // Calculate monthly data (last 12 months)
      const monthlyMap = new Map<string, { distance: number; activities: number }>();
      const now = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        monthlyMap.set(key, { distance: 0, activities: 0 });
      }

      activities.forEach((activity: { start_date: string; distance: number }) => {
        const date = new Date(activity.start_date);
        const key = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        if (monthlyMap.has(key)) {
          const current = monthlyMap.get(key)!;
          monthlyMap.set(key, {
            distance: current.distance + (activity.distance || 0),
            activities: current.activities + 1,
          });
        }
      });

      setMonthlyData(
        Array.from(monthlyMap.entries()).map(([month, data]) => ({
          month,
          distance: data.distance,
          activities: data.activities,
        }))
      );

      // Calculate activity type distribution
      const typeMap = new Map<string, { count: number; distance: number }>();
      activities.forEach((activity: { type: string; distance: number }) => {
        const type = activity.type || 'Other';
        const current = typeMap.get(type) || { count: 0, distance: 0 };
        typeMap.set(type, {
          count: current.count + 1,
          distance: current.distance + (activity.distance || 0),
        });
      });

      setActivityTypeData(
        Array.from(typeMap.entries()).map(([type, data]) => ({
          type,
          count: data.count,
          distance: data.distance,
        }))
      );

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    totalStats,
    monthlyData,
    activityTypeData,
    loading,
    error,
    refetch: fetchStats,
  };
};

export default useStats;
