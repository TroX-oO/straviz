import { format, parseISO, startOfWeek, getYear, formatDistanceToNow } from 'date-fns';

export type Units = 'metric' | 'imperial';

export function formatDistance(meters: number, units: 'metric' | 'imperial'): string {
  if (units === 'imperial') {
    const miles = meters / 1609.344;
    return `${miles.toFixed(2)} mi`;
  }
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

export function formatDistanceValue(meters: number, units: 'metric' | 'imperial'): number {
  if (units === 'imperial') {
    return meters / 1609.344;
  }
  return meters / 1000;
}

export function formatElevation(meters: number, units: 'metric' | 'imperial'): string {
  if (units === 'imperial') {
    const feet = meters * 3.28084;
    return `${Math.round(feet)} ft`;
  }
  return `${Math.round(meters)} m`;
}

export function formatElevationValue(meters: number, units: 'metric' | 'imperial'): number {
  if (units === 'imperial') {
    return meters * 3.28084;
  }
  return meters;
}

export function formatSpeed(metersPerSecond: number, units: 'metric' | 'imperial'): string {
  if (units === 'imperial') {
    const mph = metersPerSecond * 2.23694;
    return `${mph.toFixed(1)} mph`;
  }
  const kmh = metersPerSecond * 3.6;
  return `${kmh.toFixed(1)} km/h`;
}

export function formatPace(metersPerSecond: number, units: Units): string {
  if (metersPerSecond === 0) return '--:--';
  
  const secondsPerKm = 1000 / metersPerSecond;
  const secondsPerMile = 1609.344 / metersPerSecond;
  
  const seconds = units === 'metric' ? secondsPerKm : secondsPerMile;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  
  const unit = units === 'metric' ? '/km' : '/mi';
  return `${mins}:${secs.toString().padStart(2, '0')}${unit}`;
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

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), 'MMM d, yyyy');
}

export function formatDateTime(dateString: string): string {
  return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
}

export function formatMonth(dateString: string): string {
  return format(parseISO(dateString), 'MMM yyyy');
}

export function formatWeek(dateString: string): string {
  return format(parseISO(dateString), "'Week' w, yyyy");
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(Math.round(value));
}

export function formatCompactNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

export function getDistanceUnit(units: Units): string {
  return units === 'metric' ? 'km' : 'mi';
}

export function getElevationUnit(units: Units): string {
  return units === 'metric' ? 'm' : 'ft';
}

export function getSpeedUnit(units: Units): string {
  return units === 'metric' ? 'km/h' : 'mph';
}

export function getMonthKey(dateString: string): string {
  return format(parseISO(dateString), 'MMM yyyy');
}

export function getWeekKey(dateString: string): string {
  const date = parseISO(dateString);
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  return format(weekStart, 'MMM d');
}

export function getYearKey(dateString: string): number {
  return getYear(parseISO(dateString));
}

export function getActivityTypeColor(type: string): string {
  const colors: Record<string, string> = {
    Run: '#FC4C02',
    Ride: '#00A1E4',
    Swim: '#00B5AD',
    Walk: '#8BC34A',
    Hike: '#795548',
    VirtualRide: '#7B1FA2',
    VirtualRun: '#E91E63',
    WeightTraining: '#607D8B',
    Workout: '#FF9800',
    Yoga: '#9C27B0',
    default: '#9E9E9E',
  };
  return colors[type] || colors.default;
}
