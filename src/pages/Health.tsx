import React from 'react';
import { HeartPulse, AlertTriangle, Brain, ZapOff, Activity } from 'lucide-react';
import { useHydrationStore } from '../lib/hydration-store';

export default function Health() {
  const { profile, currentIntake } = useHydrationStore();
  
  const weight = profile?.weight || 70;
  const heightMeters = (profile?.height || 170) / 100;
  const bmi = (weight / (heightMeters * heightMeters)).toFixed(1);
  const goal = profile?.daily_goal || 2500;
  const intakePercent = (currentIntake / goal) * 100;

  // Predictor Logic
  let riskLevel = 'Low Risk';
  let riskColor = 'text-green-400';
  let riskMessage = 'Your hydration matches your metabolic needs.';

  if (intakePercent < 40) {
    riskLevel = 'High Risk';
    riskColor = 'text-rose-400';
    riskMessage = 'Severe deficit detected. At risk for fatigue and poor focus.';
  } else if (intakePercent < 75) {
    riskLevel = 'Elevated';
    riskColor = 'text-amber-400';
    riskMessage = 'Mild dehydration. You may experience headaches.';
  }

  return (
    <div className="p-4 space-y-6 pb-24 text-slate-50 bg-[#0B1120] min-h-screen">
      <h1 className="text-2xl font-bold pt-2 flex items-center gap-2">
        <HeartPulse className="w-6 h-6 text-rose-500" /> Health Metrics
      </h1>

      {/* Basic Metrics (Kept) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#161F32] border border-slate-800 p-6 rounded-[24px] shadow-lg">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Current BMI</p>
          <p className="text-3xl font-black text-slate-100">{bmi}</p>
        </div>
        <div className="bg-[#161F32] border border-slate-800 p-6 rounded-[24px] shadow-lg">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Target Goal</p>
          <p className="text-2xl font-black text-cyan-400">{goal / 1000}L</p>
        </div>
      </div>

      {/* Dehydration Predictor (Kept) */}
      <div className="bg-[#161F32] border border-slate-800 p-6 rounded-[32px] shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Current Status Risk</h2>
          <AlertTriangle className={`w-6 h-6 ${riskColor}`} />
        </div>
        
        <div className="flex items-end gap-3 mb-4">
          <span className={`text-4xl font-black ${riskColor}`}>{riskLevel}</span>
        </div>
        
        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
          <p className="text-sm text-slate-300 leading-relaxed">{riskMessage}</p>
        </div>
      </div>

      {/* --- NEW: Disadvantages of Dehydration --- */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Why Hydration Matters</h3>
        
        <div className="bg-rose-500/5 border border-rose-500/20 p-5 rounded-[24px] space-y-4">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center shrink-0 border border-rose-500/20">
              <Brain className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-rose-100 mb-1">Cognitive Decline</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Even 2% dehydration impairs focus, memory, and your brain's processing speed.</p>
            </div>
          </div>
          
          <div className="w-full h-px bg-slate-800"></div>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0 border border-amber-500/20">
              <ZapOff className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-100 mb-1">Physical Fatigue</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Blood volume drops when dehydrated, making your heart work harder and draining your energy.</p>
            </div>
          </div>

          <div className="w-full h-px bg-slate-800"></div>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center shrink-0 border border-purple-500/20">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-purple-100 mb-1">Kidney & Joint Strain</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Lack of water reduces joint lubrication and forces kidneys to work overtime to filter toxins.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}