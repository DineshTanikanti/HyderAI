import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHydrationStore } from '../lib/hydration-store';
import { supabase } from '../lib/supabase';
import { Droplet, Mail, Lock, ChevronLeft, ArrowRight, User, Scale, Ruler, CalendarDays } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const { fetchUserData, calculateGoal } = useHydrationStore();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Physical Profile State
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState(25);
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(170);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && step === 2) {
      setStep(3); // Move to physical details if signing up
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // Full Signup Flow
        const { data: authData, error: authError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { full_name: fullName } }
        });
        if (authError) throw authError;

        // Calculate custom goal based on formula
        const dailyGoal = calculateGoal(weight, 'Moderate', null);

        // Save physical details to profile
        if (authData.user) {
          await supabase.from('profiles').update({
            full_name: fullName,
            age: age,
            weight: weight,
            height: height,
            daily_goal: dailyGoal
          }).eq('id', authData.user.id);
        }
      }
      
      await fetchUserData();
      navigate('/');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-50 flex flex-col p-6 font-sans">
      {/* Step 1: Welcome */}
      {step === 1 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-32 h-32 bg-cyan-500/20 rounded-full flex items-center justify-center mb-8 border border-cyan-500/30">
            <Droplet className="w-16 h-16 text-cyan-500 fill-cyan-500" />
          </div>
          <h1 className="text-4xl font-black text-cyan-500 mb-2">HydrAI</h1>
          <p className="text-slate-400 mb-12">Smart hydration for a healthier you.</p>
          <button onClick={() => setStep(2)} className="w-full py-4 bg-cyan-500 text-white font-bold rounded-2xl active:scale-95 transition flex items-center justify-center gap-2">
            Get Started <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Step 2: Account Creation */}
      {step === 2 && (
        <div className="flex-1 flex flex-col justify-center animate-in fade-in duration-300">
          <h2 className="text-2xl font-bold mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-sm text-slate-400 mb-8">{isLogin ? 'Sign in to sync your data.' : 'Join HydrAI to start your journey.'}</p>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input type="text" placeholder="Full Name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-[#161F32] border border-slate-700 rounded-xl p-4 pl-12 focus:border-cyan-500 outline-none" />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#161F32] border border-slate-700 rounded-xl p-4 pl-12 focus:border-cyan-500 outline-none" />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#161F32] border border-slate-700 rounded-xl p-4 pl-12 focus:border-cyan-500 outline-none" />
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 bg-cyan-500 text-white font-bold rounded-xl active:scale-95 transition disabled:opacity-50 mt-4">
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Continue')}
            </button>
          </form>

          <div className="mt-8 flex flex-col gap-4 items-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-slate-400 hover:text-cyan-400">
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-xs text-slate-500 hover:text-white">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Physical Details (Only for Signup) */}
      {step === 3 && !isLogin && (
        <div className="flex-1 flex flex-col justify-center animate-in slide-in-from-right duration-300">
          <h2 className="text-2xl font-bold mb-2">Almost Done!</h2>
          <p className="text-sm text-slate-400 mb-8">This helps us calculate your perfect daily water goal and BMI.</p>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input type="number" placeholder="Age (e.g. 25)" required value={age} onChange={(e) => setAge(parseInt(e.target.value))} className="w-full bg-[#161F32] border border-slate-700 rounded-xl p-4 pl-12 focus:border-cyan-500 outline-none" />
            </div>
            <div className="relative">
              <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input type="number" placeholder="Weight in kg (e.g. 70)" required value={weight} onChange={(e) => setWeight(parseInt(e.target.value))} className="w-full bg-[#161F32] border border-slate-700 rounded-xl p-4 pl-12 focus:border-cyan-500 outline-none" />
            </div>
            <div className="relative">
              <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input type="number" placeholder="Height in cm (e.g. 170)" required value={height} onChange={(e) => setHeight(parseInt(e.target.value))} className="w-full bg-[#161F32] border border-slate-700 rounded-xl p-4 pl-12 focus:border-cyan-500 outline-none" />
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 bg-cyan-500 text-white font-bold rounded-xl active:scale-95 transition mt-4">
              {loading ? 'Creating Account...' : 'Complete Signup'}
            </button>
          </form>

          <div className="mt-8 flex flex-col gap-4 items-center">
            <button onClick={() => setStep(2)} className="flex items-center gap-2 text-xs text-slate-500 hover:text-white">
              <ChevronLeft className="w-4 h-4" /> Back to Account Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}