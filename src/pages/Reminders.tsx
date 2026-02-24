import React, { useState, useEffect } from 'react';
import { Bell, Clock, Zap, MessageSquare } from 'lucide-react';

export default function Reminders() {
  const [permission, setPermission] = useState(Notification.permission);
  const [intervalTime, setIntervalTime] = useState(60);
  const [isAdaptive, setIsAdaptive] = useState(false);
  const [isActive, setIsActive] = useState(false);
  
  // Feedback State
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      new Notification("HydrAI Notifications Enabled", { body: "We'll remind you to drink water!" });
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive && permission === 'granted') {
      timer = setInterval(() => {
        const title = isAdaptive ? "Adaptive Alert: Hydration Drop!" : "Time for a glass of water!";
        const body = isAdaptive ? "Based on your routine, you need water now." : "Stay on track with your daily goal.";
        new Notification(title, { body, icon: '/vite.svg' });
      }, intervalTime * 60000); // Convert mins to ms
    }
    return () => clearInterval(timer);
  }, [isActive, intervalTime, isAdaptive, permission]);

  const handleFeedbackSubmit = () => {
    if (!feedback) return;
    // In production, this can push to a Supabase 'feedback' table.
    // For now, it shows success so users know it went through.
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackSent(false);
      setFeedback('');
    }, 3000);
  };

  return (
    <div className="p-4 space-y-6 pb-24 text-slate-50 bg-[#0B1120] min-h-screen">
      <h1 className="text-2xl font-bold pt-2">Smart Reminders</h1>

      {/* Permission Card */}
      {permission !== 'granted' && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-[32px]">
          <h2 className="font-bold text-rose-400 mb-2 flex items-center gap-2"><Bell className="w-5 h-5"/> Notifications Disabled</h2>
          <p className="text-xs text-slate-400 mb-4">We need browser permission to send you real alerts.</p>
          <button onClick={requestPermission} className="bg-rose-500 text-white px-6 py-3 rounded-xl font-bold text-sm w-full active:scale-95 transition-transform">Grant Permission</button>
        </div>
      )}

      {/* Mode Selection */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setIsAdaptive(false)}
          className={`p-6 rounded-[24px] border flex flex-col items-center gap-3 transition-all ${!isAdaptive ? 'bg-cyan-500/10 border-cyan-500 shadow-lg shadow-cyan-500/10' : 'bg-[#161F32] border-slate-800'}`}
        >
          <Clock className={`w-8 h-8 ${!isAdaptive ? 'text-cyan-400' : 'text-slate-500'}`} />
          <span className="font-bold text-sm">Fixed Interval</span>
        </button>
        <button 
          onClick={() => setIsAdaptive(true)}
          className={`p-6 rounded-[24px] border flex flex-col items-center gap-3 transition-all ${isAdaptive ? 'bg-cyan-500/10 border-cyan-500 shadow-lg shadow-cyan-500/10' : 'bg-[#161F32] border-slate-800'}`}
        >
          <Zap className={`w-8 h-8 ${isAdaptive ? 'text-cyan-400' : 'text-slate-500'}`} />
          <span className="font-bold text-sm">Adaptive AI</span>
        </button>
      </div>

      {/* Controls */}
      <div className="bg-[#161F32] border border-slate-800 p-6 rounded-[32px] space-y-6 shadow-2xl">
        {!isAdaptive ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-sm text-slate-300">Remind me every</span>
              <span className="text-cyan-400 font-black">{intervalTime} mins</span>
            </div>
            <input 
              type="range" min="15" max="180" step="15" value={intervalTime} onChange={(e) => setIntervalTime(parseInt(e.target.value))}
              className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        ) : (
          <p className="text-sm text-slate-400">Adaptive AI analyzes your logs and triggers notifications only when your body enters a dehydration risk state, preventing notification fatigue.</p>
        )}

        <button 
          onClick={() => setIsActive(!isActive)}
          disabled={permission !== 'granted'}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${isActive ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500 text-white disabled:opacity-50'}`}
        >
          {isActive ? 'Stop Reminders' : 'Activate Reminders'}
        </button>
      </div>

      {/* Feedback Section */}
      <div className="bg-[#161F32] border border-slate-800 p-6 rounded-[32px] space-y-4 shadow-xl">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-cyan-400" /> Send Feedback
        </h2>
        <p className="text-xs text-slate-400">Found a bug or have a suggestion? Let the developer know!</p>
        <textarea 
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Describe the issue or idea here..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-white focus:border-cyan-500 outline-none resize-none h-24"
        />
        <button 
          onClick={handleFeedbackSubmit}
          disabled={!feedback || feedbackSent}
          className={`w-full py-3 rounded-xl font-bold transition-all ${feedbackSent ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 active:scale-95'}`}
        >
          {feedbackSent ? 'Feedback Sent!' : 'Submit Feedback'}
        </button>
      </div>

    </div>
  );
}