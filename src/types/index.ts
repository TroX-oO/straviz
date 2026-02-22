export interface Athlete {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  city: string;
  state: string;
  country: string;
  sex: 'M' | 'F';
  premium: boolean;
  profile: string;
  profile_medium: string;
  created_at: string;
  updated_at: string;
  weight: number;
  bikes: Gear[];
  shoes: Gear[];
}

export interface Gear {
  id: string;
  primary: boolean;
  name: string;
  distance: number;
  brand_name?: string;
  model_name?: string;
  description?: string;
  retired?: boolean;
}

export interface Activity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: ActivityType;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  timezone: string;
  utc_offset: number;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  photo_count: number;
  map: ActivityMap;
  trainer: boolean;
  commute: boolean;
  manual: boolean;
  private: boolean;
  visibility: string;
  flagged: boolean;
  gear_id: string | null;
  start_latlng: [number, number] | null;
  end_latlng: [number, number] | null;
  average_speed: number;
  max_speed: number;
  average_cadence?: number;
  average_watts?: number;
  weighted_average_watts?: number;
  kilojoules?: number;
  device_watts?: boolean;
  has_heartrate: boolean;
  average_heartrate?: number;
  max_heartrate?: number;
  heartrate_opt_out: boolean;
  display_hide_heartrate_option: boolean;
  elev_high?: number;
  elev_low?: number;
  upload_id: number;
  upload_id_str: string;
  external_id: string;
  from_accepted_tag: boolean;
  pr_count: number;
  total_photo_count: number;
  has_kudoed: boolean;
  suffer_score?: number;
}

export interface ActivityMap {
  id: string;
  summary_polyline: string | null;
  resource_state: number;
}

export type ActivityType =
  | 'AlpineSki'
  | 'BackcountrySki'
  | 'Canoeing'
  | 'Crossfit'
  | 'EBikeRide'
  | 'Elliptical'
  | 'Golf'
  | 'Handcycle'
  | 'Hike'
  | 'IceSkate'
  | 'InlineSkate'
  | 'Kayaking'
  | 'Kitesurf'
  | 'NordicSki'
  | 'Ride'
  | 'RockClimbing'
  | 'RollerSki'
  | 'Rowing'
  | 'Run'
  | 'Sail'
  | 'Skateboard'
  | 'Snowboard'
  | 'Snowshoe'
  | 'Soccer'
  | 'StairStepper'
  | 'StandUpPaddling'
  | 'Surfing'
  | 'Swim'
  | 'Velomobile'
  | 'VirtualRide'
  | 'VirtualRun'
  | 'Walk'
  | 'WeightTraining'
  | 'Wheelchair'
  | 'Windsurf'
  | 'Workout'
  | 'Yoga';

export interface TokenResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete: Athlete;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  athlete: Athlete | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ActivityState {
  activities: Activity[];
  loading: boolean;
  lastSync: number | null;
  error: string | null;
}

export interface GearState {
  bikes: Gear[];
  shoes: Gear[];
  loading: boolean;
  error: string | null;
}

export interface SettingsState {
  units: 'metric' | 'imperial';
  theme: 'light' | 'dark';
}

export interface Stats {
  totalDistance: number;
  totalElevation: number;
  totalMovingTime: number;
  totalActivities: number;
  activeDays: number;
}

export interface MonthlyData {
  month: string;
  distance: number;
  elevation: number;
  activities: number;
}

export interface YearlyData {
  year: number;
  distance: number;
  elevation: number;
  activities: number;
}

export interface WeeklyData {
  week: string;
  activities: number;
  distance: number;
}

export interface ActivityTypeData {
  type: string;
  count: number;
  distance: number;
}

export interface GearStats {
  id: string;
  name: string;
  distance: number;
  activities: number;
  type: 'bike' | 'shoe';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}