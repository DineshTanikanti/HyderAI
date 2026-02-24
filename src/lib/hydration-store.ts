import { create } from 'zustand';
import { supabase } from './supabase';

export interface HydrationLog {
  id: string;
  amount: number;
  created_at: string;
}

interface HydrationState {
  user: any | null;
  logs: HydrationLog[];
  currentIntake: number;
  loading: boolean;
  fetchUserData: () => Promise<void>;
  addWater: (amount: number) => Promise<void>;
  removeLog: (id: string) => Promise<void>;
}

export const useHydrationStore = create<HydrationState>((set, get) => ({
  user: null,
  logs: [],
  currentIntake: 0,
  loading: true,

  fetchUserData: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return set({ loading: false });

    const today = new Date().toISOString().split('T')[0];
    const { data: logs } = await supabase.from('water_logs')
      .select('*').eq('user_id', user.id).gte('created_at', today);
    
    set({ 
      user, 
      logs: logs || [], 
      currentIntake: logs?.reduce((acc, curr) => acc + curr.amount, 0) || 0,
      loading: false 
    });
  },

  removeLog: async (id: string) => {
    await supabase.from('water_logs').delete().eq('id', id);
    await get().fetchUserData(); // Correct use of get()
  },

  addWater: async (amount: number) => {
    const state = get(); // Correct way to access user
    if (!state.user) return;
    await supabase.from('water_logs').insert([{ user_id: state.user.id, amount }]);
    await get().fetchUserData();
  }
}));