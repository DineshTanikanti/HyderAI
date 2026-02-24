import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Plus, Droplet, History, Clock, Flame, LogOut, X, CloudSun, User } from 'lucide-react';
import { useHydrationStore } from '../lib/hydration-store';

export default function Dashboard() {
  const navigate = useNavigate();
  // Added 'user' to the destructured store to safely catch the name
  const { currentIntake, profile, user, streak, weatherTemp, addWater, logs, removeLog, signOut, updateProfile } = useHydrationStore();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const [formWeight, setFormWeight] = useState(profile?.weight || 70);
  const [formActivity, setFormActivity] = useState(profile?.activity_level || 'Moderate');

  const goal = profile?.daily_goal || 2500;
  const percentage = Math.min(100, Math.round((currentIntake / goal) * 100));
  const remaining = Math.max(0, goal - currentIntake);

  // --- FIX: Smart Name Formatting ---
  // Tries to get the name from the profile, then auth metadata. 
  const rawName = profile?.full_name || user?.user_metadata?.full_name || '';
  const firstName = rawName ? rawName.split(' ')[0] : '';
  // If we have a name, use "Dinesh's Dashboard". If empty, use "My Dashboard".
  const dashboardTitle = firstName ? `${firstName}'s Dashboard` : 'My Dashboard';

  const getStatus = () => {
    if (percentage < 30) return { label: 'Dehydrated', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
    if (percentage < 80) return { label: 'Hydrating', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    return { label: 'Healthy', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' };
  };
  const status = getStatus();

  const handleLogout = async () => {
    await signOut();
    setShowSettings(false);
    navigate('/onboarding');
  };

  const handleCustomAdd = () => {
    if (customAmount) {
      addWater(parseInt(customAmount));
      setCustomAmount('');
      setShowCustom(false);
    }
  };

  const handleSaveProfile = async () => {
    await updateProfile({ weight: formWeight, activity_level: formActivity });
    setShowSettings(false);
  };

  return (
    <div className="p-4 space-y-6 pb-28 bg-[#0B1120] min-h-screen text-slate-50 relative">
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#161F32] w-full max-w-sm rounded-[32px] p-6 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg flex items-center gap-2"><User className="w-5 h-5 text-cyan-400"/> Edit Profile</h3>
              <button onClick={() => setShowSettings(false)} className="p-2 bg-slate-800 rounded-full"><X className="w-4 h-4 text-slate-400"/></button>
            </div>
            
            <div className="space-y-4 overflow-y-auto mb-6">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Weight (kg)</label>
                <input type="number" value={formWeight} onChange={(e) => setFormWeight(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 mt-1 focus:border-cyan-500 outline-none text-white" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Activity Level</label>
                <select value={formActivity} onChange={(e) => setFormActivity(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 mt-1 focus:border-cyan-500 outline-none appearance-none text-white">
                  <option value="Low">Low (Sedentary)</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High (Active/Athlete)</option>
                </select>
              </div>
            </div>

            <div className="mt-auto space-y-3">
              <button onClick={handleSaveProfile} className="w-full py-4 bg-cyan-500 text-white rounded-2xl font-bold active:scale-95 transition-transform">
                Save & Update Goal
              </button>
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-4 bg-rose-500/10 text-rose-500 rounded-2xl font-bold active:scale-95 transition-transform">
                <LogOut className="w-5 h-5" /> Logout Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Droplet className="text-white fill-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight leading-none">HydrAI</h1>
            {/* Displaying the Fixed Title */}
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{dashboardTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {weatherTemp && (
            <div className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border ${weatherTemp >= 35 ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-slate-800/50 border-slate-700/50 text-slate-300'}`}>
              <CloudSun className="w-4 h-4" />
              <span className="text-xs font-bold">{weatherTemp}°C</span>
            </div>
          )}
          <button onClick={() => setShowSettings(true)} className="p-2.5 bg-slate-800/50 rounded-xl text-slate-400"><Settings className="w-5 h-5" /></button>
        </div>
      </header>

      {/* Shiny Bottle Card */}
      <div className="bg-[#161F32] border border-slate-800 rounded-[32px] p-8 shadow-2xl">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-slate-100 font-bold text-lg">Goal Status</h2>
            <p className="text-slate-500 text-sm">{(currentIntake / 1000).toFixed(1)}L / {(goal / 1000).toFixed(1)}L</p>
          </div>
          <span className={`px-3 py-1 ${status.bg} border ${status.border} rounded-full text-[10px] font-black ${status.color} uppercase tracking-tighter`}>
            ● {status.label}
          </span>
        </div>

        <div className="my-10 flex justify-center relative">
          <div className="w-36 h-64 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 bg-slate-700 rounded-t-lg z-20 border-b border-slate-600 shadow-md"></div>
            <div className="w-full h-full bg-slate-800/30 border-[6px] border-slate-700/50 rounded-[48px] relative overflow-hidden backdrop-blur-sm shadow-inner">
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-600 via-cyan-500 to-cyan-400 transition-all duration-1000 ease-in-out" style={{ height: `${percentage}%` }}>
                {percentage > 0 && percentage < 100 && (
                  <div className="absolute -top-4 left-0 w-[200%] h-8 bg-cyan-400/30 rounded-[40%] animate-wave opacity-50"></div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-black text-3xl drop-shadow-md">{percentage}%</span>
                </div>
              </div>
              <div className="absolute top-8 left-4 w-2 h-24 bg-white/10 rounded-full blur-[1px]"></div>
              <div className="absolute top-12 left-8 w-1 h-12 bg-white/5 rounded-full blur-[1px]"></div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-slate-800/50">
          <div>
            <p className="text-cyan-400 font-black text-2xl tracking-tighter">{remaining}ml</p>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">To Goal</p>
          </div>
          <div className="text-right">
            <p className="text-slate-100 font-bold text-xl flex items-center justify-end gap-1">{streak} <Flame className="w-5 h-5 text-orange-500 fill-orange-500" /></p>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Streak Days</p>
          </div>
        </div>
      </div>

      {/* Quick Add + Custom Button */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Quick Add</h3>
        <div className="grid grid-cols-4 gap-2">
          {[250, 500].map((amount) => (
            <button key={amount} onClick={() => addWater(amount)} className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl flex flex-col items-center gap-1 active:scale-95 transition-all">
              <Droplet className="w-4 h-4 text-cyan-500" />
              <span className="font-bold text-xs">{amount}ml</span>
            </button>
          ))}
          <button onClick={() => setShowCustom(true)} className="col-span-2 bg-cyan-500 text-white p-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 font-bold text-xs transition-transform">
            <Plus className="w-4 h-4" /> Custom
          </button>
        </div>
      </div>

      {/* Activity Logs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Today's Activity</h3>
          <History className="w-4 h-4 text-slate-600" />
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center bg-slate-800/10 border-2 border-dashed border-slate-800 rounded-[32px]">
            <p className="text-slate-600 text-sm">No hydration logged today.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="bg-[#161F32] border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-cyan-500/5 rounded-xl flex items-center justify-center border border-cyan-500/10"><Clock className="w-5 h-5 text-cyan-500/50" /></div>
                  <div>
                    <p className="font-bold text-sm text-slate-100">{log.amount}ml</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <button onClick={() => removeLog(log.id)} className="p-2 text-slate-700 hover:text-rose-500 transition-colors"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Add Modal */}
      {showCustom && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-end p-4">
          <div className="bg-[#161F32] w-full rounded-[32px] p-8 border border-slate-800 animate-in slide-in-from-bottom-full">
            <h3 className="font-bold mb-4">Add Custom Amount</h3>
            <input 
              type="number" placeholder="Enter amount in ml" autoFocus
              value={customAmount} onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 mb-4 focus:border-cyan-500 outline-none text-white font-bold"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCustom(false)} className="flex-1 py-4 bg-slate-800 rounded-2xl font-bold">Cancel</button>
              <button onClick={handleCustomAdd} className="flex-[2] py-4 bg-cyan-500 text-white rounded-2xl font-bold">Log Water</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}