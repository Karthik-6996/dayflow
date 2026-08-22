import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!import.meta.env?.VITE_SUPABASE_URL || !import.meta.env?.VITE_SUPABASE_ANON_KEY) {
  // Graceful fallback for mock mode
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const IS_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';
