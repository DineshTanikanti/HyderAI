import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, BarChart2, Bell, Users, ShieldAlert } from 'lucide-react';

export default function Layout() {
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/analytics', icon: BarChart2, label: 'Analytics' },
    { to: '/reminders', icon: Bell, label: 'Reminders' },
    { to: '/groups', icon: Users, label: 'Groups' },
    { to: '/health', icon: ShieldAlert, label: 'Health' },
  ];

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-50 flex flex-col font-sans">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#0F172A]/95 backdrop-blur-lg border-t border-slate-800 px-6 py-3 pb-8 flex justify-between items-center z-50">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-colors ${
                isActive ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            {/* Active Indicator Dot */}
            <div className={`w-1 h-1 rounded-full mt-0.5 transition-opacity active-dot`}></div>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}