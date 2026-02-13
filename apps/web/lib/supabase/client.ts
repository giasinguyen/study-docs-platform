import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️  Missing Supabase configuration. Authentication features will be disabled.');
    // Return a mock client that won't crash the app
    return null as any;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
