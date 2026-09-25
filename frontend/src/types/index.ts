export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH' | 'CRITICAL';
export type AlertPriority = 'INFO' | 'WATCH' | 'WARNING' | 'HIGH WARNING' | 'CRITICAL';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    request_id?: string;
  };
  disclaimer?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    page_size: number;
    total_records: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  disclaimer?: string;
}

export interface DistrictSummary {
  id: number;
  district_name: string;
  pcode?: string;
  province: string;
  latitude: number;
  longitude: number;
  area_sqkm?: number;
  population?: number;
  total_events: number;
  total_deaths: number;
  total_missing: number;
  total_injured: number;
  houses_destroyed: number;
  people_affected: number;
  deaths_per_100k: number;
  hazard_breakdown?: Record<string, number>;
  current_overall_risk?: RiskLevel;
  current_risk_score?: number;
  current_flood_risk?: RiskLevel;
  current_landslide_risk?: RiskLevel;
  current_agriculture_risk?: RiskLevel;
  active_alert_count?: number;
  latest_rainfall_mm?: number;
}

export interface DistrictDetail extends DistrictSummary {
  decade_breakdown?: Record<string, number>;
  worst_event?: Record<string, any>;
  geometry?: any;
  municipalities?: any[];
  recent_events?: any[];
  active_alerts?: any[];
  nearest_river_station?: any;
  risk_factors?: string[];
  risk_explanation?: string;
  last_updated?: string;
}

export interface HistoricalEvent {
  id: number;
  event_id: string;
  source: string;
  date: string;
  year: number;
  month?: number;
  hazard_type: string;
  district: string;
  municipality?: string;
  latitude: number;
  longitude: number;
  geo_precision: string;
  severity_score: number;
  severity_class: string;
  title?: string;
  deaths: number;
  missing: number;
  injured: number;
  houses_destroyed: number;
  source_url?: string;
}

export interface Alert {
  id: number;
  alert_id: string;
  district: string;
  district_id: number;
  hazard: string;
  title?: string;
  risk_level: RiskLevel;
  priority: AlertPriority;
  score: number;
  message: string;
  trigger_factors: string[];
  source: string;
  data_timestamp: string;
  status: 'ACTIVE' | 'EXPIRED' | 'RESOLVED';
  acknowledged: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
}

export interface RiverStation {
  id: number;
  station_id: string;
  station_name: string;
  river_name: string;
  basin: string;
  district: string;
  latitude: number;
  longitude: number;
  warning_level_m: number;
  danger_level_m: number;
  current_water_level: number | null;
  trend: string;
  status: string;
  feed_status: string;
  distance_to_warning: number | null;
  distance_to_danger: number | null;
  last_updated?: string;
  source: string;
  notes?: string;
}

export interface RainfallDistrictItem {
  district_name: string;
  rain_1h: number;
  rain_3h: number;
  rain_6h: number;
  rain_12h: number;
  rain_24h: number;
  rain_48h: number;
  rain_72h: number;
  imerg_24h_mm: number;
  dhm_warning_triggered: boolean;
  status: string;
  source: string;
  retrieved_at: string;
}

export interface AgricultureRisk {
  id: number;
  district_id: number;
  district_name: string;
  crop_risk_level: RiskLevel;
  risk_score: number;
  rainfall_stress_level: string;
  temperature_stress_level: string;
  flood_exposure_level: string;
  landslide_exposure_level: string;
  soil_moisture_condition: string;
  recent_rainfall_mm: number;
  forecast_rainfall_mm: number;
  avg_temperature_c?: number;
  soil_moisture_val?: number;
  guidance_label: string;
  suggested_actions: string[];
  risk_summary: string;
  calculated_at: string;
}

export interface DataSourceItem {
  id: number;
  name: string;
  provider: string;
  url?: string;
  licence: string;
  purpose: string;
  limitations?: string;
  attribution_text: string;
  status: string;
  last_successful_fetch?: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  roles: { id: number; name: string }[];
}
