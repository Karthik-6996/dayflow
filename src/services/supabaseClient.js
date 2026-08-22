// src/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Environment variables or fallback defaults for local/demo mode
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Global toggle for mock vs real backend
// When team's Supabase backend URL and keys are added to .env, set VITE_USE_MOCK=false
export const IS_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';
