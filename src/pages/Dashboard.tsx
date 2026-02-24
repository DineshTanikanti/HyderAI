import { useEffect, useState } from 'react';
import { Settings, Droplet, Flame } from 'lucide-react';
import { useHydrationStore } from '../lib/hydration-store';

export default function Dashboard() {
  const { currentIntake, profile, addWater, fetchUserData } = useHydrationStore();
  
  // New state to fix the INP window.prompt error
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customVal, setCustomVal] = useState('');

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const goal = profile?.daily_goal || 2500;
  const percentage = Math.min(100, Math.round((currentIntake / goal) * 100));
  const remaining = Math.max(0, goal - currentIntake);
  
  const currentLiters = (currentIntake / 1000).toFixed(1);
  const goalLiters = (goal / 1000).toFixed(1);
  const streakDays = profile?.streak || 0;

  const handleCustomSubmit = () => {
    if (customVal && !isNaN(Number(customVal))) {
      addWater(Number(customVal));
      setIsCustomizing(false);
      setCustomVal('');
    }
  };

  return (
    <div className="p-4 space-y-6 pb-28 bg-[#0B1120] min-h-screen text-slate-50 font-sans">
      <header className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center">
            <Droplet className="text-white fill-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl leading-tight">HydrAI</h1>
            <p className="text-xs text-slate-400">Dashboard</p>
          </div>
        </div>
        <button className="p-2 bg-slate-800/50 rounded-xl border border-slate-700">
          <Settings className="w-5 h-5 text-slate-300" />
        </button>
      </header>

      <div className="bg-[#161F32] border border-slate-800/80 rounded-3xl p-6 shadow-xl">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-white font-bold text-xl">Today's Hydration</h2>
            <p className="text-slate-400 text-sm">{currentLiters}L / {goalLiters}L</p>
          </div>
          <div className="flex items-center gap-2 bg-yellow-900/30 border border-yellow-700/50 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-yellow-500 text-xs font-bold">Medium Risk</span>
          </div>
        </div>
        
        <div className="flex justify-center mb-8">
          <div className="relative flex flex-col items-center w-32 h-64">
            <div className="w-12 h-4 bg-slate-600 rounded-t-md z-10 border border-slate-500"></div>
            <div className="w-16 h-6 bg-slate-800/50 border-x-2 border-slate-600/50"></div>
            <div className="relative w-full flex-1 border-2 border-slate-600/50 rounded-[2rem] bg-gradient-to-b from-slate-800/30 to-slate-800/10 overflow-hidden flex flex-col justify-end">
               <div 
                 className="w-full bg-cyan-500 transition-all duration-1000 border-t-2 border-cyan-300/50" 
                 style={{ height: `${Math.max(percentage, 5)}%` }}
               ></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-10">
              <span className="text-white font-bold text-3xl">{percentage}%</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center items-center divide-x divide-slate-700/80">
          <div className="px-6 text-center">
            <p className="text-cyan-400 font-black text-2xl">{remaining}ml</p>
            <p className="text-slate-400 text-xs mt-1">Remaining</p>
          </div>
          <div className="px-6 text-center flex flex-col items-center">
            <p className="text-cyan-400 font-black text-2xl flex items-center gap-1">
              <Flame className="w-5 h-5 text-cyan-400" /> {streakDays}
            </p>
            <p className="text-slate-400 text-xs mt-1">Day Streak</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-100 ml-1">Quick Add</h3>
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => addWater(250)} className="bg-[#161F32] border border-slate-800/80 flex flex-col items-center justify-center py-5 rounded-2xl active:scale-95 transition-all hover:bg-slate-800/50">
            <Droplet className="w-6 h-6 mb-2 text-cyan-500" />
            <span className="text-cyan-500 font-medium text-sm">250ml</span>
          </button>
          <button onClick={() => addWater(500)} className="bg-[#161F32] border border-slate-800/80 flex flex-col items-center justify-center py-5 rounded-2xl active:scale-95 transition-all hover:bg-slate-800/50">
            <Droplet className="w-6 h-6 mb-2 text-cyan-500" />
            <span className="text-cyan-500 font-medium text-sm">500ml</span>
          </button>
          
          {/* Replaced window.prompt with inline state UI */}
          {!isCustomizing ? (
            <button onClick={() => setIsCustomizing(true)} className="bg-cyan-900/20 border border-cyan-800 flex flex-col items-center justify-center py-5 rounded-2xl active:scale-95 transition-all">
              <span className="text-cyan-400 text-xl mb-1">+</span>
              <span className="text-cyan-400 font-medium text-sm">Custom</span>
            </button>
          ) : (
            <div className="bg-cyan-900/20 border border-cyan-800 flex flex-col items-center justify-center p-2 rounded-2xl">
              <input 
                type="number" 
                value={customVal} 
                onChange={e => setCustomVal(e.target.value)} 
                placeholder="ml" 
                autoFocus
                className="w-full bg-slate-900/50 text-center text-cyan-400 text-sm py-2 rounded outline-none mb-2 placeholder:text-cyan-800/50"
              />
              <div className="flex w-full gap-2">
                <button onClick={() => setIsCustomizing(false)} className="flex-1 text-[10px] font-bold text-slate-400 py-1.5 bg-slate-800 rounded">X</button>
                <button onClick={handleCustomSubmit} className="flex-1 text-[10px] text-cyan-900 font-black py-1.5 bg-cyan-400 rounded">Add</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-100 ml-1">Today's Log</h3>
        <div className="bg-[#161F32] border border-slate-800/80 rounded-3xl p-6 text-center shadow-xl">
           <p className="text-slate-500 text-sm">Log your water to see history here.</p>
        </div>
      </div>
    </div>
  );
}