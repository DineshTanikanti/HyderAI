import React, { useEffect, useState } from 'react';
import { Calendar as CalIcon, BarChart2, TrendingUp } from 'lucide-react';
import { useHydrationStore } from '../lib/hydration-store';
import { supabase } from '../lib/supabase';

export default function Analytics() {
  const { currentIntake, profile, user, streak } = useHydrationStore();
  const [historicalData, setHistoricalData] = useState<Record<string, number>>({});
  const goal = profile?.daily_goal || 2500;

  // Fetch real historical data from Supabase
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 28);

      const { data } = await supabase
        .from('water_logs')
        .select('amount, created_at')
        .eq('user_id', user.id)
        .gte('created_at', pastDate.toISOString());

      if (data) {
        const totals: Record<string, number> = {};
        data.forEach(log => {
          // Extract local YYYY-MM-DD from the timestamp
          const d = new Date(log.created_at);
          const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
          totals[dateStr] = (totals[dateStr] || 0) + log.amount;
        });
        setHistoricalData(totals);
      }
    };

    fetchHistory();
  }, [user, currentIntake]); // Re-fetch when you add water today

  // Helper to format local date
  const getLocalDateStr = (d: Date) => {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  const today = new Date();

  // 1. TRUE DATA for Weekly Bar Chart (Last 7 Days)
  const weeklyData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = getLocalDateStr(d);
    
    // If it's today (i=0), use live currentIntake, else check database history
    const val = i === 0 ? currentIntake : (historicalData[dateStr] || 0);
    
    weeklyData.push({
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      val
    });
  }

  // 2. TRUE DATA for Monthly Calendar (Last 28 Days)
  const calendar = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = getLocalDateStr(d);
    
    const val = i === 0 ? currentIntake : (historicalData[dateStr] || 0);
    const percentage = (val / goal) * 100;

    let statusColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30'; // Dehydrated (0-29%)
    if (percentage >= 80) statusColor = 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'; // Healthy (80%+)
    else if (percentage >= 30) statusColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30'; // Medium (30-79%)

    calendar.push({
      date: d.getDate(),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
      statusColor,
      isToday: i === 0
    });
  }

  return (
    <div className="p-4 space-y-6 pb-24 text-slate-50 bg-[#0B1120] min-h-screen">
      <header className="flex justify-between items-center pt-2">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <button className="p-2 bg-[#161F32] rounded-xl border border-slate-800 text-xs font-bold flex items-center gap-2">
          <CalIcon className="w-4 h-4" /> History
        </button>
      </header>

      {/* --- WEEKLY BAR CHART --- */}
      <div className="bg-[#161F32] border border-slate-800 p-6 rounded-[32px] shadow-2xl">
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <BarChart2 className="w-4 h-4"/> Weekly Overview
        </h3>
        <div className="flex items-end justify-between h-44 gap-2 mb-2">
          {weeklyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
              <div 
                className={`w-full rounded-t-xl transition-all duration-700 ease-out ${d.val >= goal ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : d.val > 0 ? 'bg-amber-500/50' : 'bg-slate-700'}`}
                style={{ height: `${Math.max(2, Math.min(100, (d.val / goal) * 100))}%` }}
              ></div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* --- FULL CALENDAR GRID (4 WEEKS) --- */}
      <div className="bg-[#161F32] border border-slate-800 p-6 rounded-[32px] shadow-2xl">
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Monthly Calendar</h3>
        
        {/* Days of the week header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-[10px] text-slate-500 font-bold">{day}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendar.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl border ${day.statusColor} ${day.isToday ? 'ring-2 ring-white ring-offset-2 ring-offset-[#161F32]' : ''}`}>
                <span className="font-bold text-xs">{day.date}</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Calendar Legend */}
        <div className="flex justify-between mt-6 border-t border-slate-800/50 pt-4 px-2">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-cyan-500/50 border border-cyan-500"></div><span className="text-[10px] text-slate-400 font-bold uppercase">Healthy</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500/50 border border-amber-500"></div><span className="text-[10px] text-slate-400 font-bold uppercase">Medium</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500/50 border border-rose-500"></div><span className="text-[10px] text-slate-400 font-bold uppercase">Dehydrated</span></div>
        </div>
      </div>

      {/* Real AI Insights */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">AI Insights</h3>
        <div className="bg-cyan-500/5 border border-cyan-500/20 p-4 rounded-2xl flex gap-4">
          <TrendingUp className="text-cyan-400 w-5 h-5 shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed">
            {streak > 0 
              ? `You are on a ${streak}-day hydration streak! Keep logging water daily to maintain your body's performance.` 
              : "Logging your water every day builds healthy habits. Drink a glass now to start a new streak!"}
          </p>
        </div>
      </div>
    </div>
  );
}