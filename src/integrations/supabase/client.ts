// This file configures the Supabase client with environment variables
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get Supabase configuration from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!SUPABASE_URL) {
  console.error('❌ MISSING ENVIRONMENT VARIABLE: VITE_SUPABASE_URL is required');
  console.error('💡 Please add VITE_SUPABASE_URL to your .env file');
  throw new Error('Missing required environment variable: VITE_SUPABASE_URL');
}

if (!SUPABASE_ANON_KEY) {
  console.error('❌ MISSING ENVIRONMENT VARIABLE: VITE_SUPABASE_ANON_KEY is required');
  console.error('💡 Please add VITE_SUPABASE_ANON_KEY to your .env file');
  throw new Error('Missing required environment variable: VITE_SUPABASE_ANON_KEY');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Export the URL for use in other parts of the application
export const getSupabaseUrl = () => SUPABASE_URL;