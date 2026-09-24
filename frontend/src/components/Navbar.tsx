import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Map, 
  AlertTriangle, 
  CloudRain, 
  Waves, 
  Sun, 
  Sprout, 
  BarChart3, 
  Layers, 
  Activity, 
  User, 
  Menu, 
  X, 
  BookOpen, 
  Building2,
  Clock
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [nptTime, setNptTime] = useState('');
  const location = useLocation();

  // Keep Nepal Standard Time (UTC+5:45) ticking
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // UTC + 5:45 in minutes is 345 min
      const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
      const nptDate = new Date(utcMs + (345 * 60000));
      
      const timeStr = nptDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      setNptTime(`${timeStr} NPT`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: Activity },
    { to: '/map', label: 'GIS Map', icon: Map },
    { to: '/districts', label: '77 Districts', icon: Building2 },
    { to: '/alerts', label: 'Alerts', icon: AlertTriangle },
    { to: '/rainfall', label: 'Rainfall', icon: CloudRain },
    { to: '/rivers', label: 'Rivers', icon: Waves },
    { to: '/forecast', label: 'Forecast', icon: Sun },
    { to: '/agriculture', label: 'Agriculture', icon: Sprout },
    { to: '/events', label: 'Events', icon: Layers },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/sources', label: 'Sources', icon: BookOpen },
    { to: '/system-status', label: 'Status', icon: Activity },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Identity */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-red-600 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Shield className="text-blue-400 group-hover:text-blue-300 transition-colors" size={20} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  MausamGuard
                </span>
                <span className="text-xs px-1.5 py-0.2 font-semibold bg-red-600/30 text-red-300 border border-red-500/40 rounded">
                  NEPAL
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wide">Monitor. Assess. Warn.</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.slice(0, 8).map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    active
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon size={14} />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* Dropdown for More Links */}
            <div className="relative group">
              <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center gap-1">
                <span>More</span>
                <span className="text-[10px]">▼</span>
              </button>
              <div className="absolute right-0 top-full mt-1 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 hidden group-hover:block backdrop-blur-xl">
                {navLinks.slice(8).map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Icon size={14} className="text-slate-400" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
                <div className="h-px bg-slate-800 my-1" />
                <Link
                  to="/methodology"
                  className="px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                >
                  <BookOpen size={14} className="text-slate-400" />
                  <span>Methodology</span>
                </Link>
                <Link
                  to="/admin"
                  className="px-3 py-2 rounded-lg text-xs text-amber-400 hover:bg-slate-800 flex items-center gap-2 font-medium"
                >
                  <Shield size={14} />
                  <span>Admin Console</span>
                </Link>
              </div>
            </div>
          </nav>

          {/* Right Action: Live NPT Clock & Login */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/70 border border-slate-700/60 text-xs text-slate-300">
              <Clock size={12} className="text-blue-400" />
              <span className="font-mono text-[11px]">{nptTime || 'NPT'}</span>
            </div>

            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
            >
              <User size={13} />
              <span>Portal Sign In</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex xl:hidden items-center gap-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="xl:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-6 space-y-1">
          <div className="flex items-center gap-2 py-2 px-3 text-xs text-slate-400 border-b border-slate-800 mb-2">
            <Clock size={13} className="text-blue-400" />
            <span>Nepal Standard Time: <strong>{nptTime}</strong></span>
          </div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  active ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon size={16} />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-800 flex gap-2">
            <Link
              to="/methodology"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center py-2 text-xs bg-slate-800 text-slate-300 rounded-lg"
            >
              Methodology
            </Link>
            <Link
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center py-2 text-xs bg-amber-600/20 text-amber-300 border border-amber-500/30 rounded-lg"
            >
              Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
