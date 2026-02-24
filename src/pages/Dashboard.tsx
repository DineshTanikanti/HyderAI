import { useState } from 'react';
import { Settings, Plus, Droplet, History, Clock, Flame, LogOut, X, CloudSun, User } from 'lucide-react';
import { useHydrationStore } from '../lib/hydration-store';

export default function Dashboard() {
  const { currentIntake, profile, user, streak, weatherTemp, addWater, logs, removeLog, signOut, updateProfile } = useHydrationStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const goal = profile?.daily_goal || 2500;
  const percentage = Math.min(100, Math.round((currentIntake / goal) * 100));
  const remaining = Math.max(0, goal - currentIntake);

  // FIX: Proper name logic for "Dinesh's Dashboard"
  const rawName = profile?.full_name || user?.user_metadata?.full_name || '';
  const firstName = rawName.split(' ')[0];
  const dashboardTitle = firstName ? `${firstName}'s Dashboard` : 'My Dashboard';

  const handleSaveProfile = async (e: any) => {
    e.preventDefault();
    const weight = Number(e.target.weight.value);
    const activity = e.target.activity.value;
    await updateProfile({ weight, activity_level: activity });
    setShowSettings(false);
  };

  return (
    <div className="p-4 space-y-6 pb-28 bg-[#0B1120] min-h-screen text-slate-50">
      {/* Header */}
      <header className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center">
            <Droplet className="text-white fill-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-xl">HydrAI</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{dashboardTitle}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {weatherTemp && (
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded-lg text-xs font-bold">
              <CloudSun className="w-4 h-4 text-orange-400" /> {weatherTemp}°C
            </div>
          )}
          <button onClick={() => setShowSettings(true)} className="p-2 bg-slate-800 rounded-xl"><Settings className="w-5 h-5"/></button>
        </div>
      </header>

      {/* Main Stats Card */}
      <div className="bg-[#161F32] border border-slate-800 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-start">
          <h2 className="font-bold text-lg text-slate-100">Daily Goal</h2>
          <span className="text-orange-500 font-bold flex items-center gap-1">{streak} <Flame className="w-4 h-4 fill-orange-500"/></span>
        </div>
        
        <div className="my-8 flex justify-center relative">
          <div className="w-32 h-32 rounded-full border-[10px] border-slate-800 flex items-center justify-center relative">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="10" className="text-cyan-500" strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * percentage) / 100} />
            </svg>
            <span className="text-2xl font-black">{percentage}%</span>
          </div>
        </div>

        <div className="flex justify-between border-t border-slate-800 pt-6">
          <div className="text-center flex-1 border-r border-slate-800">
            <p className="text-cyan-400 font-black text-xl">{currentIntake}ml</p>
            <p className="text-[9px] text-slate-500 uppercase font-bold">Drank</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-slate-100 font-black text-xl">{remaining}ml</p>
            <p className="text-[9px] text-slate-500 uppercase font-bold">Left</p>
          </div>
        </div>
      </div>

      {/* Quick Add */}
      <div className="grid grid-cols-3 gap-3">
        {[250, 500].map(amt => (
          <button key={amt} onClick={() => addWater(amt)} className="bg-slate-800/50 p-4 rounded-2xl font-bold active:scale-95 transition-all">+{amt}ml</button>
        ))}
        <button onClick={() => setShowCustom(true)} className="bg-cyan-500 text-white p-4 rounded-2xl font-bold active:scale-95 transition-all">Custom</button>
      </div>

      {/* Activity Log */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><History className="w-4 h-4"/> Recent Activity</h3>
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="bg-[#161F32] p-4 rounded-2xl flex justify-between items-center border border-slate-800">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-slate-500"/>
                <span className="font-bold text-sm">{log.amount}ml</span>
              </div>
              <button onClick={() => removeLog(log.id)} className="p-2 text-slate-600 hover:text-rose-500"><X className="w-4 h-4"/></button>
            </div>
          ))}
          {logs.length === 0 && <p className="text-center py-6 text-slate-600 text-sm italic">No water logged yet today.</p>}
        </div>
      </div>

      {/* Modals (Settings & Custom Add) */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-[#161F32] w-full p-8 rounded-[32px] border border-slate-800">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><User className="text-cyan-400"/> Profile Settings</h3>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-2">Weight (kg)</label>
                <input name="weight" type="number" defaultValue={profile?.weight || 70} className="w-full bg-slate-900 p-4 rounded-xl outline-none border border-slate-700 focus:border-cyan-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-2">Activity Level</label>
                <select name="activity" defaultValue={profile?.activity_level || 'Moderate'} className="w-full bg-slate-900 p-4 rounded-xl outline-none border border-slate-700 focus:border-cyan-500">
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                </select>
              </div>
              <button type="submit" className="w-full py-4 bg-cyan-500 rounded-2xl font-bold">Save Changes</button>
              <button type="button" onClick={() => { signOut(); setShowSettings(false); }} className="w-full py-4 bg-rose-500/10 text-rose-500 rounded-2xl font-bold flex items-center justify-center gap-2"><LogOut className="w-4 h-4"/> Sign Out</button>
              <button type="button" onClick={() => setShowSettings(false)} className="w-full text-slate-500 font-bold">Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}