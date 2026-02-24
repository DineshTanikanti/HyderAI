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

  // Logic to calculate goal based on physical metrics and environment
  calculateGoal: (weight = 70, activity = 'Moderate', temp = null) => {
    let base = weight * 35; // Standard: 35ml per kg
    if (activity === 'High') base += 500;
    if (activity === 'Low') base -= 200;
    
    // AI Weather Modifier: Increase goal if temperature is high
    if (temp && temp >= 35) base += 500;
    return Math.round(base);
  },

  fetchUserData: async () => {
    set({ loading: true });
    try {
      // 1. Fetch Local Weather (Tadipatri coordinates)
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=14.9131&longitude=78.0108&current_weather=true');
        const weatherData = await res.json();
        set({ weatherTemp: weatherData.current_weather.temperature });
      } catch (e) {
        console.error("Weather sync failed:", e);
      }

      // 2. Auth & Profile Sync
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        set({ user });
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        
        // Use stored goal or calculate dynamic one
        const goal = profile?.daily_goal || get().calculateGoal(profile?.weight, profile?.activity_level, get().weatherTemp);
        set({ profile: { ...profile, daily_goal: goal } });

        // 3. Log History & Streak Calculation
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: allLogs } = await supabase
          .from('water_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false });

        if (allLogs) {
          const todayStr = new Date().toISOString().split('T')[0];
          const todaysLogs = allLogs.filter(log => log.created_at.startsWith(todayStr));
          const totalToday = todaysLogs.reduce((acc, log) => acc + log.amount, 0);

          // Real Date-based Streak Logic
          const dailyTotals: Record<string, number> = {};
          allLogs.forEach(log => {
            const date = log.created_at.split('T')[0];
            dailyTotals[date] = (dailyTotals[date] || 0) + log.amount;
          });

          let calculatedStreak = 0;
          let checkDate = new Date();
          for (let i = 0; i < 30; i++) {
            const dStr = checkDate.toISOString().split('T')[0];
            if ((dailyTotals[dStr] || 0) >= goal) {
              calculatedStreak++;
            } else if (i > 0) break;
            checkDate.setDate(checkDate.getDate() - 1);
          }

          set({ logs: todaysLogs, currentIntake: totalToday, streak: calculatedStreak });
        }
      }
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (updates) => {
    const { user, weatherTemp } = get();
    if (!user) return;
    
    const newGoal = get().calculateGoal(updates.weight, updates.activity_level, weatherTemp);
    const finalUpdates = { ...updates, daily_goal: newGoal };

    const { error } = await supabase.from('profiles').update(finalUpdates).eq('id', user.id);
    if (!error) {
      set((state) => ({ profile: { ...state.profile, ...finalUpdates } }));
    }
  },

  addWater: async (amount: number) => {
    const { user, currentIntake } = get();
    if (!user) return;

    // Safety Limit Check (Max 5 Liters)
    if (currentIntake + amount > 5000) {
      alert("Safety Alert: You've reached the 5L daily limit. High water intake should be monitored.");
      return;
    }

    const { data, error } = await supabase
      .from('water_logs')
      .insert([{ user_id: user.id, amount }])
      .select()
      .single();

    if (!error && data) {
      set((state) => ({ 
        currentIntake: state.currentIntake + amount, 
        logs: [data, ...state.logs] 
      }));
    }
  },

  removeLog: async (id: string) => {
    // Database check first
    const { error } = await supabase.from('water_logs').delete().eq('id', id);
    
    if (!error) {
      const { logs } = get();
      const logToRemove = logs.find(l => l.id === id);
      if (logToRemove) {
        set((state) => ({
          logs: state.logs.filter(l => l.id !== id),
          currentIntake: Math.max(0, state.currentIntake - logToRemove.amount)
        }));
      }
    } else {
      alert("Sync Error: Could not delete log.");
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, logs: [], currentIntake: 0, streak: 0 });
    localStorage.clear();
  }
}));