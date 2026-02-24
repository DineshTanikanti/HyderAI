import { useEffect, useState } from 'react';
import { Droplet, History, Clock, X, CloudSun, Flame } from 'lucide-react';
import { useHydrationStore } from '../lib/hydration-store';

export default function Dashboard() {
  const { currentIntake, profile, user, weatherTemp, addWater, logs, removeLog, fetchUserData } = useHydrationStore();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customVal, setCustomVal] = useState('');

  useEffect(() => { fetchUserData(); }, [fetchUserData]);

  const goal = profile?.daily_goal || 2500;
  const percentage = Math.min(100, Math.round((currentIntake / goal) * 100));
  const remaining = Math.max(0, goal - currentIntake);

  const handleCustomSubmit = () => {
    if (customVal && !isNaN(Number(customVal))) {
      addWater(Number(customVal));
      setIsCustomizing(false);
      setCustomVal('');
    }
  };

  return (
    <div className="p-4 space-y-6 pb-28 bg-[#0B1120] min-h-screen text-slate-50">
      <header className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center">
            <Droplet className="text-white fill-white w-6 h-6" />
          </div>
          <h1 className="font-black text-xl uppercase tracking-tighter">HydrAI</h1>
        </div>
        {weatherTemp && (
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-300">
            <CloudSun className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-bold">{weatherTemp}°C</span>
          </div>
        )}
      </header>

      <div className="bg-[#161F32] border border-slate-800 rounded-[32px] p-6 text-center">
        <div className="flex justify-between text-left mb-4">
           <div>
             <p className="text-2xl font-black">{currentIntake}ml</p>
             <p className="text-[10px] text-slate-500 font-bold uppercase">Total Drank Today</p>
           </div>
           <div className="text-right">
             <p className="text-2xl font-black">{percentage}%</p>
             <p className="text-[10px] text-slate-500 font-bold uppercase">Daily Progress</p>
           </div>
        </div>

        <div className="flex justify-center my-6">
          <div className="relative w-24 h-44 border-4 border-slate-700 rounded-b-3xl rounded-t-xl overflow-hidden bg-slate-900/50">
            <div className="absolute bottom-0 w-full bg-cyan-500 transition-all duration-1000" style={{ height: `${percentage}%` }}></div>
            <div className="absolute inset-0 flex items-center justify-center font-black text-2xl drop-shadow-md">{percentage}%</div>
          </div>
        </div>
        <p className="text-slate-400 text-sm">{remaining}ml remaining to goal</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => addWater(250)} className="bg-slate-800/50 p-4 rounded-2xl font-bold">+250ml</button>
        <button onClick={() => addWater(500)} className="bg-slate-800/50 p-4 rounded-2xl font-bold">+500ml</button>
        {!isCustomizing ? (
          <button onClick={() => setIsCustomizing(true)} className="bg-cyan-900/30 border border-cyan-800 p-4 rounded-2xl font-bold text-cyan-400">+ Custom</button>
        ) : (
          <div className="bg-cyan-900/30 border border-cyan-800 p-2 rounded-2xl flex gap-1">
            <input type="number" value={customVal} onChange={e => setCustomVal(e.target.value)} placeholder="ml" className="w-full bg-slate-900 rounded p-1 text-xs outline-none" />
            <button onClick={handleCustomSubmit} className="bg-cyan-500 text-white px-2 rounded text-xs">Add</button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2"><History className="w-4 h-4" /> Activity Log</h3>
        {logs.map(log => (
          <div key={log.id} className="bg-[#161F32] border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-cyan-500" />
              <div>
                <p className="font-bold text-sm">{log.amount}ml</p>
                <p className="text-[10px] text-slate-500">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            <button onClick={() => removeLog(log.id)}><X className="w-4 h-4 text-slate-600" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}