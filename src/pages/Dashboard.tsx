import { useEffect } from 'react';
import { Settings, Plus, Droplet, History, Clock, X, CloudSun } from 'lucide-react';
import { useHydrationStore } from '../lib/hydration-store';

export default function Dashboard() {
  const { currentIntake, profile, user, weatherTemp, addWater, logs, removeLog, fetchUserData } = useHydrationStore();

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const goal = profile?.daily_goal || 2500;
  const percentage = Math.min(100, Math.round((currentIntake / goal) * 100));
  const remaining = Math.max(0, goal - currentIntake);

  // Fixes the "My's Dashboard" error
  const rawName = profile?.full_name || user?.user_metadata?.full_name || '';
  const firstName = rawName.split(' ')[0];
  const dashboardTitle = firstName ? `${firstName}'s Dashboard` : 'My Dashboard';

  return (
    <div className="p-4 space-y-6 pb-28 bg-[#0B1120] min-h-screen text-slate-50">
      <header className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Droplet className="text-white fill-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight">HydrAI</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{dashboardTitle}</p>
          </div>
        </div>
        {weatherTemp && (
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300">
            <CloudSun className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-bold">{weatherTemp}°C</span>
          </div>
        )}
      </header>

      <div className="bg-[#161F32] border border-slate-800 rounded-[32px] p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-10">
          <div>
            <p className="text-cyan-400 font-black text-3xl">{currentIntake}ml</p>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total Drank Today</p>
          </div>
          <div className="text-right">
            <p className="text-slate-100 font-black text-3xl">{percentage}%</p>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Daily Progress</p>
          </div>
        </div>
        
        <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-cyan-500 transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
        </div>
        
        <p className="text-center text-slate-400 text-sm font-medium">{remaining}ml remaining to hit your goal</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => addWater(250)} className="bg-slate-800/50 p-5 rounded-2xl font-bold active:scale-95 transition-all">+250ml</button>
        <button onClick={() => addWater(500)} className="bg-slate-800/50 p-5 rounded-2xl font-bold active:scale-95 transition-all">+500ml</button>
        <button onClick={() => addWater(1000)} className="bg-cyan-500 text-white p-5 rounded-2xl font-bold active:scale-95 transition-all">+1L</button>
      </div>

      <div className="space-y-4">
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
           <History className="w-4 h-4" /> Activity Log
        </h3>
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="bg-[#161F32] border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
                  <Clock className="w-4 h-4 text-cyan-500" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-100">{log.amount}ml</p>
                  <p className="text-[10px] text-slate-500 font-bold">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <button onClick={() => removeLog(log.id)} className="p-2 text-slate-700 hover:text-rose-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="p-8 text-center bg-slate-800/10 border-2 border-dashed border-slate-800 rounded-[32px]">
              <p className="text-slate-600 text-sm">No hydration logged today.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}