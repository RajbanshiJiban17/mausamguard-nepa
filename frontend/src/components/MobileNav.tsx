import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Shield,
  Activity,
  Map,
  Building2,
  AlertTriangle,
  CloudRain,
  Waves,
  Sun,
  Sprout,
  Layers,
  BarChart3,
  BookOpen,
  Menu,
  X,
  Clock,
  Radio,
  Sparkles,
  User
} from 'lucide-react';
import { api } from '../api/client';

export const MobileNav: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [nptTime, setNptTime] = useState('');
  const [alertCount, setAlertCount] = useState<number>(0);
  const location = useLocation();

  // NPT Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const nptDate = new Date(utcMs + 345 * 60000);
      const timeStr = nptDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      setNptTime(`${timeStr} NPT`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch active alerts count
  useEffect(() => {
    api.getActiveAlerts()
      .then((res) => {
        if (Array.isArray(res)) setAlertCount(res.length);
        else if (res?.total !== undefined) setAlertCount(res.total);
      })
      .catch(() => {});
  }, [location.pathname]);

  // Close drawer upon route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const quickNav = [
    { to: '/', label: 'Overview', icon: Activity },
    { to: '/map', label: 'GIS Map', icon: Map },
    { to: '/districts', label: 'Districts', icon: Building2 },
    {
      to: '/alerts',
      label: 'Alerts',
      icon: AlertTriangle,
      badge: alertCount > 0 ? `${alertCount}` : undefined,
    },
  ];

  const allModules = [
    { title: 'Real-Time Feeds', items: [
      { to: '/', label: 'National Dashboard', icon: Activity },
      { to: '/map', label: 'Interactive GIS Map', icon: Map },
      { to: '/rainfall', label: 'Rainfall Radar', icon: CloudRain },
      { to: '/rivers', label: 'River Basins & Water Levels', icon: Waves },
      { to: '/forecast', label: '7-Day Weather Forecast', icon: Sun },
    ]},
    { title: 'Hazards & Advisory', items: [
      { to: '/alerts', label: 'Disaster Early Warnings', icon: AlertTriangle, badge: alertCount > 0 ? `${alertCount}` : undefined },
      { to: '/districts', label: '77 District Risk Profiles', icon: Building2 },
      { to: '/agriculture', label: 'Agricultural Advisories', icon: Sprout },
      { to: '/events', label: 'Historical Disasters & BIPAD', icon: Layers },
    ]},
    { title: 'Analytics & Governance', items: [
      { to: '/analytics', label: 'Hazard Analytics', icon: BarChart3 },
      { to: '/sources', label: 'Data Sources & Sensors', icon: BookOpen },
      { to: '/system-status', label: 'System Telemetry', icon: Radio },
      { to: '/methodology', label: 'Scientific Methodology', icon: Sparkles },
      { to: '/admin', label: 'Admin & Operator Console', icon: Shield },
    ]},
  ];

  return (
    <>
      {/* Top Mobile Bar (Fixed) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-slate-950/95 border-b border-slate-800/80 backdrop-blur-xl px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-red-600 p-0.5 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
              <Shield className="text-blue-400" size={16} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-sm text-white">MausamGuard</span>
              <span className="text-[9px] px-1 font-bold bg-red-600/30 text-red-300 border border-red-500/40 rounded">
                NEPAL
              </span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono">
            <Clock size={11} className="text-blue-400" />
            <span>{nptTime || 'NPT'}</span>
          </div>

          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Toggle navigation"
          >
            {drawerOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Slide-out Mobile Drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-4/5 max-w-xs bg-slate-950 border-r border-slate-800 h-full overflow-y-auto flex flex-col justify-between p-4 z-10 shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <Shield size={18} />
                  </div>
                  <span className="font-extrabold text-sm text-white">MausamGuard Nepal</span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {allModules.map((section, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300 px-2 mb-1">
                      {section.title}
                    </div>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.to);
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setDrawerOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            active
                              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                              : 'text-slate-300 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon size={16} className={active ? 'text-blue-400' : 'text-slate-400'} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-600 text-white font-bold animate-pulse">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 mt-6">
              <Link
                to="/login"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20"
              >
                <User size={14} />
                <span>Portal Sign In</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Navigation Bar (Thumb-accessible) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-xl px-2 flex items-center justify-around">
        {quickNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                active ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon size={20} className={active ? 'scale-110 transition-transform' : ''} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${active ? 'font-semibold text-blue-400' : ''}`}>
                {item.label}
              </span>
              {active && (
                <div className="w-5 h-0.5 bg-blue-500 rounded-full mt-0.5 shadow-sm shadow-blue-400" />
              )}
            </Link>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-slate-200"
        >
          <Menu size={20} />
          <span className="text-[10px] mt-1 font-medium">More</span>
        </button>
      </nav>
    </>
  );
};

export default MobileNav;
