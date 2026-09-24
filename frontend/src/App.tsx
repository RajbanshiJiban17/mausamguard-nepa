import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';
import DistrictsPage from './pages/DistrictsPage';
import DistrictDetailPage from './pages/DistrictDetailPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import AlertsPage from './pages/AlertsPage';
import RainfallPage from './pages/RainfallPage';
import RiversPage from './pages/RiversPage';
import ForecastPage from './pages/ForecastPage';
import AgriculturePage from './pages/AgriculturePage';
import AnalyticsPage from './pages/AnalyticsPage';
import SourcesPage from './pages/SourcesPage';
import MethodologyPage from './pages/MethodologyPage';
import AboutPage from './pages/AboutPage';
import SystemStatusPage from './pages/SystemStatusPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          {/* Main National Dashboard */}
          <Route index element={<DashboardPage />} />

          {/* Interactive GIS Map */}
          <Route path="map" element={<MapPage />} />

          {/* Districts Explorer & Details */}
          <Route path="districts" element={<DistrictsPage />} />
          <Route path="district/:id" element={<DistrictDetailPage />} />

          {/* Historical Hazard Events */}
          <Route path="events" element={<EventsPage />} />
          <Route path="events/:eventId" element={<EventDetailPage />} />

          {/* Early Warning Alerts */}
          <Route path="alerts" element={<AlertsPage />} />

          {/* Hydrometeorological Modules */}
          <Route path="rainfall" element={<RainfallPage />} />
          <Route path="rivers" element={<RiversPage />} />
          <Route path="forecast" element={<ForecastPage />} />
          <Route path="agriculture" element={<AgriculturePage />} />

          {/* Analytics & Research */}
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="sources" element={<SourcesPage />} />
          <Route path="methodology" element={<MethodologyPage />} />
          <Route path="about" element={<AboutPage />} />

          {/* System Operations & Governance */}
          <Route path="system-status" element={<SystemStatusPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="admin" element={<AdminPage />} />

          {/* Fallback to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
