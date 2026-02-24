import { create } from 'zustand';
import { supabase } from './supabase';

export interface HydrationLog {
  id: string;
  amount: number;
  created_at: string;
}

interface HydrationState {
  user: any | null;
  profile: any | null;
  logs: HydrationLog[];
  currentIntake: number;
  streak: number;
  loading: boolean;
  weatherTemp: number | null;
  fetchUserData: () => Promise<void>;
  addWater: (amount: number) => Promise<void>;
  removeLog: (id: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: any) => Promise<void>;
  calculateGoal: (weight?: number, activity?: string, temp?: number | null) => number;
}

export const useHydrationStore = create<HydrationState>((set, get) => ({
  user: null,
  profile: null,
  logs: [],
  currentIntake: 0,
  streak: 0,
  loading: true,
  weatherTemp: null,

  calculateGoal: (weight = 70, activity = 'Moderate', temp = null) => {
    let base = weight * 35; 
    if (activity === 'High') base += 500;
    if (activity === 'Low') base -= 200;
    if (temp && temp >= 35) base += 500; // AI Weather Adjustment for Tadipatri heat
    return Math.round(base);
  },

  fetchUserData: async () => {
    try {
      // Fetch fresh weather data for Tadipatri
      const weatherRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=14.9131&longitude=78.0108&current_weather=true');
      const weatherData = await weatherRes.json();
      const temp = weatherData.current_weather.temperature;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        const goal = profile?.daily_goal || get().calculateGoal(profile?.weight, profile?.activity_level, temp);

        const today = new Date().toISOString().split('T')[0];
        // Fetch fresh logs directly from the server
        const { data: todaysLogs, error: logError } = await supabase
          .from('water_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', today)
          .order('created_at', { ascending: false });

        if (logError) throw logError;

        const total = todaysLogs?.reduce((sum, log) => sum + log.amount, 0) || 0;

        set({ 
          user, 
          profile: { ...profile, daily_goal: goal }, 
          weatherTemp: temp,
          logs: todaysLogs || [],
          currentIntake: total,
          loading: false 
        });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error("Critical Sync Error:", error);
      set({ loading: false });
    }
  },

  addWater: async (amount: number) => {
    const { user, currentIntake } = get();
    if (!user) return;

    // Safety Threshold: 5L Daily Limit
    if (currentIntake + amount > 5000) {
      alert("Hydration Safety: 5L daily limit reached.");
      return;
    }

    const { error } = await supabase
      .from('water_logs')
      .insert([{ user_id: user.id, amount }]);

    if (!error) {
      // Force immediate re-fetch to ensure mobile/laptop parity
      await get().fetchUserData();
    }
  },

  removeLog: async (id: string) => {
    // 1. Delete the record from the cloud database
    const { error } = await supabase
      .from('water_logs')
      .delete()
      .eq('id', id);
    
    if (error) {
      alert("Sync Error: Could not delete data from server.");
      return;
    }

    // 2. ULTIMATE FIX: Instead of filtering local state, 
    // we force a complete re-fetch from the database.
    // This guarantees that if it's gone in the cloud, it's gone on your screen.
    await get().fetchUserData();
  },

  updateProfile: async (updates) => {
    const { user, weatherTemp } = get();
    if (!user) return;
    const newGoal = get().calculateGoal(updates.weight, updates.activity_level, weatherTemp);
    const { error } = await supabase.from('profiles').update({ ...updates, daily_goal: newGoal }).eq('id', user.id);
    if (!error) {
      await get().fetchUserData();
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, logs: [], currentIntake: 0 });
    window.location.href = '/onboarding';
  }
}));