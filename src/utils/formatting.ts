export function formatDistance(meters: number, units: 'metric' | 'imperial'): string {
  if (units === 'metric') {
    const km = meters / 1000;
    return `${km.toFixed(2)} km`;
  } else {
    const miles = meters / 1609.344;
    return `${miles.toFixed(2)} mi`;
  }
}

export function formatDistanceValue(meters: number, units: 'metric' | 'imperial'): number {
  if (units === 'metric') {
    return meters / 1000;
  } else {
    return meters / 1609.344;
  }
}

export function formatElevation(meters: number, units: 'metric' | 'imperial'): string {
  if (units === 'metric') {
    return `${Math.round(meters)} m`;
  } else {
    const feet = meters * 3.28084;
    return `${Math.round(feet)} ft`;
  }
}

export function formatElevationValue(meters: number, units: 'metric' | 'imperial'): number {
  if (units === 'metric') {
    return meters;
  } else {
    return meters * 3.28084;
  }
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${secs}s`;
}

export function formatDurationLong(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }
  return `${minutes} min`;
}

export function formatSpeed(metersPerSecond: number, units: 'metric' | 'imperial'): string {
  if (units === 'metric') {
    const kmh = metersPerSecond * 3.6;
    return `${kmh.toFixed(1)} km/h`;
  } else {
    const mph = metersPerSecond * 2.23694;
    return `${mph.toFixed(1)} mph`;
  }
}

export function formatPace(metersPerSecond: number, units: 'metric' | 'imperial'): string {
  if (metersPerSecond === 0) return '-';

  if (units === 'metric') {
    const minPerKm = 1000 / metersPerSecond / 60;
    const mins = Math.floor(minPerKm);
    const secs = Math.round((minPerKm - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')} /km`;
  } else {
    const minPerMile = 1609.344 / metersPerSecond / 60;
    const mins = Math.floor(minPerMile);
    const secs = Math.round((minPerMile - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')} /mi`;
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

export function getActivityIcon(type: string): string {
  const icons: Record<string, string> = {
    Run: '🏃',
    Ride: '🚴',
    Swim: '🏊',
    Walk: '🚶',
    Hike: '🥾',
    AlpineSki: '⛷️',
    BackcountrySki: '🎿',
    Snowboard: '🏂',
    Workout: '💪',
    WeightTraining: '🏋️',
    Yoga: '🧘',
    VirtualRide: '🚴‍♂️',
    VirtualRun: '🏃‍♂️',
    EBikeRide: '🚲',
    Kayaking: '🛶',
    Rowing: '🚣',
    Soccer: '⚽',
    Golf: '⛳',
    Skateboard: '🛹',
    Surfing: '🏄',
    Kitesurf: '🪁',
    Windsurf: '🏄‍♂️',
  };
  return icons[type] || '🏃';
}
