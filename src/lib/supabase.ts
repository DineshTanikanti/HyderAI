import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dqvmorkqfauugwwhtqcb.supabase.co'; // From your screenshot
const supabaseAnonKey = 'sb_publishable_reoICdwsPQTTvLcRBfXt_Q_hjkLlaIQ'; // From your screenshot

export const supabase = createClient(supabaseUrl, supabaseAnonKey);