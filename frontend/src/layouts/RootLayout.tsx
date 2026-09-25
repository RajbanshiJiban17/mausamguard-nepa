import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { MobileNav } from '../components/MobileNav';
import { Footer } from '../components/Footer';

export const RootLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Desktop Visual Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Mobile Top Header & Bottom Quick Bar */}
      <MobileNav />

      {/* Responsive Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 pt-14 lg:pt-0 ${
          collapsed ? 'lg:pl-20' : 'lg:pl-72'
        } pb-16 lg:pb-0`}
      >
        <main className="flex-1 w-full">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default RootLayout;
