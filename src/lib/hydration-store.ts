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
  loading: boolean;
  weatherTemp: number | null;
  fetchUserData: () => Promise<void>;
  addWater: (amount: number) => Promise<void>;
  removeLog: (id: string) => Promise<void>;
  updateProfile: (updates: any) => Promise<void>;
}

export const useHydrationStore = create<HydrationState>((set, get) => ({
  user: null,
  profile: null,
  logs: [],
  currentIntake: 0,
  loading: true,
  weatherTemp: null,

  fetchUserData: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ loading: false });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Hard-fetch from Supabase to ignore any local cache
    const { data: logs } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', today)
      .order('created_at', { ascending: false });
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    set({ 
      user, 
      profile, 
      logs: logs || [], 
      currentIntake: logs?.reduce((acc, log) => acc + log.amount, 0) || 0,
      loading: false 
    });
  },

  addWater: async (amount: number) => {
    const { user } = get();
    if (!user) return;

    await supabase.from('water_logs').insert([{ user_id: user.id, amount }]);
    // Force re-fetch from the database
    await get().fetchUserData();
  },

  removeLog: async (id: string) => {
    // 1. Delete from Supabase
    const { error } = await supabase.from('water_logs').delete().eq('id', id);
    
    if (error) {
      alert("Error deleting from server.");
      return;
    }

    // 2. Force re-fetch. This is the only way to ensure 
    // mobile and laptop show exactly the same empty state.
    await get().fetchUserData();
  },

  updateProfile: async (updates: any) => {
    const { user } = get();
    if (!user) return;
    await supabase.from('profiles').update(updates).eq('id', user.id);
    await get().fetchUserData();
  }
}));