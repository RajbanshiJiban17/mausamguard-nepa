import { ApiResponse, PaginatedResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api/v1`
  : '/api/v1';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('mg_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMsg = json?.error?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return json.data;
}

export const api = {
  // Health
  getHealth: () => request<any>('/health', { method: 'GET' }),
  getSystemStatus: () => request<any>('/system-status'),

  // Districts
  getDistricts: (params?: { province?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.province) query.append('province', params.province);
    if (params?.search) query.append('search', params.search);
    return request<any[]>(`/districts?${query.toString()}`);
  },
  getDistrictsGeoJSON: () => request<any>('/districts/geojson'),
  getDistrictDetail: (idOrName: string) => request<any>(`/districts/${idOrName}`),
  compareDistricts: (ids: string) => request<any>(`/districts/compare?ids=${ids}`),

  // Events
  getEvents: (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
      });
    }
    return fetch(`${API_BASE}/events?${query.toString()}`, { credentials: 'include' })
      .then(res => res.json()) as Promise<PaginatedResponse<any>>;
  },
  getEventsGeoJSON: (params?: { hazard?: string; district?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.hazard) query.append('hazard', params.hazard);
    if (params?.district) query.append('district', params.district);
    if (params?.limit) query.append('limit', String(params.limit));
    return request<any>(`/events/geojson?${query.toString()}`);
  },
  getEventDetail: (eventId: string) => request<any>(`/events/${eventId}`),
  getEventStatsSummary: () => request<any>('/events/stats/summary'),
  getYearlyTrends: () => request<any[]>('/events/stats/yearly'),
  getMonthlyTrends: () => request<any[]>('/events/stats/monthly'),

  // Risk
  getNationalRiskOverview: (params?: { province?: string; min_level?: string }) => {
    const query = new URLSearchParams();
    if (params?.province) query.append('province', params.province);
    if (params?.min_level) query.append('min_level', params.min_level);
    return request<any>(`/risk/districts?${query.toString()}`);
  },
  getDistrictRisk: (idOrName: string) => request<any>(`/risk/${idOrName}`),

  // Alerts
  getActiveAlerts: (params?: { hazard?: string; priority?: string; district?: string }) => {
    const query = new URLSearchParams();
    if (params?.hazard) query.append('hazard', params.hazard);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.district) query.append('district', params.district);
    return request<any>(`/alerts?${query.toString()}`);
  },
  getAlertHistory: (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
      });
    }
    return fetch(`${API_BASE}/alerts/history?${query.toString()}`, {
      credentials: 'include',
      headers: getAuthHeader(),
    }).then(res => res.json()) as Promise<PaginatedResponse<any>>;
  },
  resolveAlert: (alertId: string, notes: string) =>
    request<any>(`/alerts/${alertId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution_notes: notes }),
    }),

  // Rainfall
  getRainfallOverview: () => request<any>('/rainfall'),
  getDistrictRainfall: (districtName: string) => request<any>(`/rainfall/${districtName}`),

  // Rivers
  getRiverStations: (params?: { basin?: string; district?: string }) => {
    const query = new URLSearchParams();
    if (params?.basin) query.append('basin', params.basin);
    if (params?.district) query.append('district', params.district);
    return request<any>(`/river-stations?${query.toString()}`);
  },
  getRiverStationDetail: (stationId: string) => request<any>(`/river-stations/${stationId}`),

  // Forecast
  getDistrictForecast: (districtName: string, palika?: string, days: number = 7) => {
    const query = new URLSearchParams();
    if (palika) query.append('palika', palika);
    if (days) query.append('days', String(days));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<any>(`/forecast/${districtName}${qs}`);
  },
  getDistrictPalikas: (districtName: string) => request<any[]>(`/forecast/${districtName}/palikas`),
  getNationalForecastSummary: () => request<any>('/forecast/summary/national'),

  // Agriculture
  getAgricultureOverview: (cropRiskLevel?: string) => {
    const query = cropRiskLevel ? `?crop_risk_level=${cropRiskLevel}` : '';
    return request<any>(`/agriculture-risk${query}`);
  },
  getDistrictAgricultureRisk: (districtName: string) => request<any>(`/agriculture-risk/${districtName}`),

  // Sources
  getDataSources: () => request<any[]>('/data-sources'),
  getDataStatus: () => request<any>('/data-status'),

  // Admin
  getAdminDashboard: () => request<any>('/admin/dashboard'),
  getAdminUsers: () => request<any[]>('/admin/users'),
  toggleUserStatus: (userId: number, isActive: boolean) =>
    request<any>(`/admin/users/${userId}/status?is_active=${isActive}`, { method: 'PUT' }),
  getDataQualityReport: () => request<any>('/admin/data-quality'),
  getAuditLogs: (page = 1, pageSize = 25) =>
    fetch(`${API_BASE}/admin/audit-logs?page=${page}&page_size=${pageSize}`, {
      credentials: 'include',
      headers: getAuthHeader(),
    }).then(res => res.json()) as Promise<PaginatedResponse<any>>,
  triggerRefresh: () => request<string>('/admin/trigger-refresh', { method: 'POST' }),

  // Auth
  login: (credentials: { username_or_email: string; password: string }) =>
    request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  logout: () =>
    request<any>('/auth/logout', {
      method: 'POST',
    }),
  register: (payload: any) =>
    request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  changePassword: (payload: { current_password: string; new_password: string }) =>
    request<any>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMe: () => request<any>('/auth/me'),
};
