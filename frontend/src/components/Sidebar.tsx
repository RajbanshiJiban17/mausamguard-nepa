import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Clock,
  Sparkles,
  Radio
} from 'lucide-react';
import { api } from '../api/client';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [nptTime, setNptTime] = useState('');
  const [alertCount, setAlertCount] = useState<number>(0);
  const [user, setUser] = useState<any>(null);

  // Nepal Standard Time (UTC+5:45)
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

  // Fetch active alerts count & check user session
  useEffect(() => {
    const fetchQuickStatus = async () => {
      try {
        const alertsRes = await api.getActiveAlerts();
        if (Array.isArray(alertsRes)) {
          setAlertCount(alertsRes.length);
        } else if (alertsRes?.total !== undefined) {
          setAlertCount(alertsRes.total);
        }
      } catch {
        // silent fallback
      }

      // Check user session
      try {
        const storedUser = localStorage.getItem('mg_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // Check cookie session via /auth/me
          const me = await api.getMe();
          if (me) setUser(me);
        }
      } catch {
        setUser(null);
      }
    };

    fetchQuickStatus();
    const interval = setInterval(fetchQuickStatus, 60000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('mg_access_token');
      localStorage.removeItem('mg_user');
      setUser(null);
      navigate('/login');
    }
  };

  const navSections = [
    {
      title: 'Real-Time Monitoring',
      items: [
        { to: '/', label: 'Overview Dashboard', icon: Activity, badge: 'Live' },
        { to: '/map', label: 'GIS Interactive Map', icon: Map, badge: 'Spatial' },
        { to: '/rainfall', label: 'Rainfall & Radar', icon: CloudRain },
        { to: '/rivers', label: 'River Basins & DHM', icon: Waves },
        { to: '/forecast', label: '7-Day Forecast', icon: Sun },
      ],
    },
    {
      title: 'Hazard & Agriculture',
      items: [
        {
          to: '/alerts',
          label: 'Early Warning Alerts',
          icon: AlertTriangle,
          badge: alertCount > 0 ? `${alertCount}` : undefined,
          badgeColor: 'bg-red-500 text-white animate-pulse',
        },
        { to: '/districts', label: '77 Districts Profiles', icon: Building2 },
        { to: '/agriculture', label: 'Agriculture Advisory', icon: Sprout },
        { to: '/events', label: 'Disaster Records & BIPAD', icon: Layers },
      ],
    },
    {
      title: 'Intelligence & Admin',
      items: [
        { to: '/analytics', label: 'Hazard Analytics', icon: BarChart3 },
        { to: '/sources', label: 'Data Sources & Sensors', icon: BookOpen },
        { to: '/system-status', label: 'System Telemetry', icon: Radio },
        { to: '/methodology', label: 'Science & Methodology', icon: Sparkles },
        { to: '/admin', label: 'Operations Console', icon: Shield, adminOnly: true },
      ],
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen bg-slate-950/95 border-r border-slate-800/80 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between hidden lg:flex ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Top Header & Brand */}
      <div>
        <div className="h-16 border-b border-slate-800/80 px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 min-w-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-red-600 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Shield className="text-blue-400" size={20} />
              </div>
            </div>
            {!collapsed && (
              <div className="leading-tight truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-tight text-white">
                    MausamGuard
                  </span>
                  <span className="text-[10px] px-1 py-0.2 font-bold bg-red-600/30 text-red-300 border border-red-500/40 rounded">
                    NEPAL
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Early Warning System</div>
              </div>
            )}
          </Link>

          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Live NPT Clock & Status Bar */}
        {!collapsed ? (
          <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
              <Clock size={12} className="text-blue-400" />
              <span>{nptTime || 'NPT'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Real-Time</span>
            </div>
          </div>
        ) : (
          <div className="py-2 border-b border-slate-800/60 flex justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
          </div>
        )}

        {/* Navigation Categories */}
        <div className="overflow-y-auto max-h-[calc(100vh-210px)] py-3 px-3 space-y-5 custom-scrollbar">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm shadow-blue-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900/80 border border-transparent'
                    }`}
                  >
                    <Icon
                      size={18}
                      className={`min-w-5 transition-transform group-hover:scale-110 ${
                        active ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    {!collapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                          item.badgeColor || 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
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

      {/* Bottom User / Session Section */}
      <div className="border-t border-slate-800/80 p-3 bg-slate-900/60">
        {user ? (
          <div className="flex items-center justify-between gap-2">
            {!collapsed && (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 text-xs font-bold">
                  {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-white truncate">{user.username}</div>
                  <div className="text-[10px] text-emerald-400 font-mono">Session Active</div>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`p-2 rounded-lg bg-slate-800/80 hover:bg-red-950/60 hover:text-red-400 text-slate-400 transition-colors ${
                collapsed ? 'w-full flex justify-center' : ''
              }`}
              title="Logout Session"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition-all ${
              collapsed ? 'justify-center p-2' : ''
            }`}
            title="Portal Sign In"
          >
            <User size={16} />
            {!collapsed && <span>Portal Sign In</span>}
          </Link>
        )}

        {!collapsed && (
          <div className="pt-2 mt-2 border-t border-slate-800/60 text-[9px] text-slate-500 text-center font-mono">
            © 2026 • Jiban Chaudhary (जीवन चौधरी)
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
