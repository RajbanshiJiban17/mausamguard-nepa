import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import L from 'leaflet';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  AlertTriangle,
  Building,
  Users,
  ExternalLink,
  ShieldAlert,
  Info,
  RefreshCw
} from 'lucide-react';
import { api } from '../api/client';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { HistoricalEvent } from '../types';

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<HistoricalEvent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!eventId) return;
    loadEvent(eventId);
  }, [eventId]);

  const loadEvent = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getEventDetail(id);
      setEvent(data);
    } catch (err: any) {
      console.error('Failed to load event detail:', err);
      setError(err.message || 'Event not found');
    } finally {
      setLoading(false);
    }
  };

  // Mini Leaflet Map
  useEffect(() => {
    if (!event || !mapContainerRef.current || mapInstanceRef.current) return;
    if (!event.latitude || !event.longitude) return;

    const map = L.map(mapContainerRef.current, {
      center: [event.latitude, event.longitude],
      zoom: 11,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: 'abc',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    const isApprox = event.geo_precision?.toLowerCase().includes('approx') || event.geo_precision?.toLowerCase().includes('centroid');

    // Add marker
    const marker = L.circleMarker([event.latitude, event.longitude], {
      radius: 10,
      fillColor: event.hazard_type.toLowerCase().includes('flood') ? '#3b82f6' : '#f59e0b',
      color: '#ffffff',
      weight: 2,
      opacity: 0.9,
      fillOpacity: 0.7,
    }).addTo(map);

    marker.bindPopup(`
      <div class="p-2 text-slate-900 font-sans text-xs">
        <strong>${event.hazard_type.toUpperCase()}</strong>
        <div>${event.district} ${event.municipality ? '- ' + event.municipality : ''}</div>
        <div>Date: ${event.date}</div>
        <div class="text-[10px] text-slate-500 italic mt-1">Precision: ${event.geo_precision}</div>
      </div>
    `).openPopup();

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [event]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-2" />
        <p className="text-sm text-slate-400">Loading historical incident dossier...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Event Not Found</h2>
          <p className="text-xs text-slate-400 mb-6">{error || 'Requested event record does not exist.'}</p>
          <Link
            to="/events"
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-500 transition-colors"
          >
            Back to Events Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DisclaimerBanner />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Disaster Events Catalog</span>
          </Link>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                      event.hazard_type.toLowerCase().includes('flood')
                        ? 'bg-blue-900/40 text-blue-400 border border-blue-800/50'
                        : event.hazard_type.toLowerCase().includes('landslide')
                        ? 'bg-amber-900/40 text-amber-400 border border-amber-800/50'
                        : 'bg-sky-900/40 text-sky-400 border border-sky-800/50'
                    }`}
                  >
                    {event.hazard_type}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {event.event_id}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                  {event.title || `${event.hazard_type.toUpperCase()} in ${event.district}`}
                </h1>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Date: <strong className="text-slate-200">{event.date}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    District: <Link to={`/district/${event.district}`} className="text-blue-400 hover:underline">{event.district}</Link>
                  </span>
                  {event.municipality && (
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      Palika: {event.municipality}
                    </span>
                  )}
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-center min-w-32">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Severity Class</div>
                <div className="text-lg font-bold text-amber-400 mt-0.5">{event.severity_class || 'Standard'}</div>
                <div className="text-[10px] text-slate-400">Score: {event.severity_score?.toFixed(2) || '0.00'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Casualty & Impact KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl text-center">
            <div className="text-[11px] text-slate-400">Deaths</div>
            <div className="text-2xl font-bold font-mono text-red-400 mt-1">{event.deaths || 0}</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl text-center">
            <div className="text-[11px] text-slate-400">Missing</div>
            <div className="text-2xl font-bold font-mono text-orange-400 mt-1">{event.missing || 0}</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl text-center">
            <div className="text-[11px] text-slate-400">Injured</div>
            <div className="text-2xl font-bold font-mono text-yellow-400 mt-1">{event.injured || 0}</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl text-center">
            <div className="text-[11px] text-slate-400">Houses Destroyed</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">{event.houses_destroyed || 0}</div>
          </div>
        </div>

        {/* Spatial Precision & Leaflet Map */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Spatial Metadata */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>Geographic Precision Analysis</span>
            </h3>

            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Latitude:</span>
                <span className="font-mono text-white">{event.latitude}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Longitude:</span>
                <span className="font-mono text-white">{event.longitude}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Geo Precision Classification:</span>
                <span className="font-semibold text-amber-400 uppercase">{event.geo_precision}</span>
              </div>
            </div>

            <div className="bg-amber-950/20 border border-amber-900/40 p-4 rounded-xl text-xs space-y-2">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                <span>Geographic Precision Notice</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                As per national disaster risk data protocols, when an exact incident site GPS waypoint was not recorded at the time of the event, coordinates correspond to the <strong>{event.geo_precision}</strong>. Approximate coordinates are never represented as pinpoint ground locations.
              </p>
            </div>

            <div className="pt-2">
              <div className="text-xs text-slate-400">
                Primary Dataset Source: <strong className="text-slate-200">{event.source}</strong>
              </div>
              {event.source_url && (
                <a
                  href={event.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                >
                  <span>Verify Original Source Document</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Mini Interactive Map */}
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex flex-col">
            <h3 className="text-xs font-semibold text-slate-300 mb-2">Location Context</h3>
            <div className="flex-1 min-h-[300px] w-full rounded-xl overflow-hidden border border-slate-800 relative">
              <div ref={mapContainerRef} className="w-full h-full" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
