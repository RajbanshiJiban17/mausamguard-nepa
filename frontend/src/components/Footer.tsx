import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, BookOpen, ExternalLink, Activity, Info } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 mt-16 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white">
                <Shield size={14} />
              </div>
              <span className="font-bold text-white text-sm">MausamGuard Nepal</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              National multi-hazard early warning decision support system tracking Flood, Landslide, River Level, Rainfall, and Agriculture risk across all 77 districts of Nepal.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>77 Districts Monitored</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-3 uppercase tracking-wider text-[11px]">System Navigation</h4>
            <ul className="space-y-2 text-[11px]">
              <li><Link to="/map" className="hover:text-blue-400 transition-colors">Interactive GIS Risk Map</Link></li>
              <li><Link to="/districts" className="hover:text-blue-400 transition-colors">77 District Catalog</Link></li>
              <li><Link to="/alerts" className="hover:text-blue-400 transition-colors">Active Early Warnings</Link></li>
              <li><Link to="/rivers" className="hover:text-blue-400 transition-colors">DHM River Gauges</Link></li>
              <li><Link to="/agriculture" className="hover:text-blue-400 transition-colors">Agriculture Stress Module</Link></li>
              <li><Link to="/events" className="hover:text-blue-400 transition-colors">1971–2026 Historical Events</Link></li>
            </ul>
          </div>

          {/* Transparency & Governance */}
          <div>
            <h4 className="font-semibold text-white mb-3 uppercase tracking-wider text-[11px]">Data & Governance</h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link to="/sources" className="hover:text-blue-400 flex items-center gap-1 font-medium text-slate-200">
                  <BookOpen size={12} className="text-blue-400" />
                  <span>Data Sources & Attribution</span>
                </Link>
              </li>
              <li><Link to="/methodology" className="hover:text-blue-400 transition-colors">Risk Scoring Methodology</Link></li>
              <li><Link to="/system-status" className="hover:text-blue-400 transition-colors flex items-center gap-1"><Activity size={12} /> System Status Diagnostics</Link></li>
              <li><Link to="/about" className="hover:text-blue-400 transition-colors">About MausamGuard</Link></li>
              <li><Link to="/admin" className="hover:text-amber-400 transition-colors">Admin Console</Link></li>
            </ul>
          </div>

          {/* Authoritative Notice */}
          <div>
            <h4 className="font-semibold text-white mb-3 uppercase tracking-wider text-[11px]">Official Disclaimer</h4>
            <p className="text-[10px] leading-relaxed text-slate-400 mb-3">
              MausamGuard Nepal provides predictive decision support and risk intelligence. It does <strong className="text-slate-300">not</strong> issue official government evacuation orders. For authoritative emergency warnings, follow the Department of Hydrology & Meteorology (DHM) and NDRRMA.
            </p>
            <div className="flex gap-2 text-[10px]">
              <a href="https://dhm.gov.np" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                DHM Portal <ExternalLink size={10} />
              </a>
              <span>•</span>
              <a href="https://bipadportal.gov.np" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                BIPAD Portal <ExternalLink size={10} />
              </a>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div>
            © 2026 MausamGuard Nepal • <strong>Copyright by Jiban Chaudhary (जीवन चौधरी)</strong>. Built for disaster risk reduction and community resilience in Nepal.
          </div>
          <div className="flex items-center gap-4">
            <Link to="/sources" className="hover:text-slate-200">Data Attribution</Link>
            <Link to="/methodology" className="hover:text-slate-200">Methodology</Link>
            <Link to="/system-status" className="hover:text-slate-200">API Status</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
