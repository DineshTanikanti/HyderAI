import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

export const useHydrationStore = create<HydrationState>()(
  persist(
    (set, get) => ({
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
        if (temp && temp >= 35) base += 500;
        return Math.round(base);
      },

      fetchUserData: async () => {
        try {
          // Weather for Tadipatri
          const weatherRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=14.9131&longitude=78.0108&current_weather=true');
          const weatherData = await weatherRes.json();
          const temp = weatherData.current_weather.temperature;

          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            const goal = profile?.daily_goal || get().calculateGoal(profile?.weight, profile?.activity_level, temp);

            const today = new Date().toISOString().split('T')[0];
            const { data: todaysLogs } = await supabase
              .from('water_logs')
              .select('*')
              .eq('user_id', user.id)
              .gte('created_at', today)
              .order('created_at', { ascending: false });

            const total = todaysLogs?.reduce((sum, log) => sum + log.amount, 0) || 0;

            set({ 
              user, 
              profile: { ...profile, daily_goal: goal }, 
              weatherTemp: temp,
              logs: todaysLogs || [],
              currentIntake: total,
              loading: false 
            });
          }
        } catch (error) {
          console.error("Sync error:", error);
          set({ loading: false });
        }
      },

      addWater: async (amount: number) => {
        const { user, currentIntake } = get();
        if (!user) return;
        if (currentIntake + amount > 5000) {
          alert("Safety Limit: 5L per day.");
          return;
        }

        const { error } = await supabase.from('water_logs').insert([{ user_id: user.id, amount }]);
        if (!error) await get().fetchUserData();
      },

      removeLog: async (id: string) => {
        const { error } = await supabase.from('water_logs').delete().eq('id', id);
        if (!error) {
          // Force immediate re-fetch so all devices see the deletion
          await get().fetchUserData();
        } else {
          alert("Error: Data could not be deleted from the server.");
        }
      },

      updateProfile: async (updates) => {
        const { user, weatherTemp } = get();
        if (!user) return;
        const newGoal = get().calculateGoal(updates.weight, updates.activity_level, weatherTemp);
        await supabase.from('profiles').update({ ...updates, daily_goal: newGoal }).eq('id', user.id);
        await get().fetchUserData();
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null, logs: [], currentIntake: 0 });
        localStorage.removeItem('hydration-storage'); // Deep clean
        window.location.href = '/onboarding';
      }
    }),
    { name: 'hydration-storage' }
  )
);