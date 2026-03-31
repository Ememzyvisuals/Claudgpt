import { createBrowserClient } from '@supabase/ssr';

// Singleton pattern — one instance for the entire app
// Prevents "Multiple GoTrueClient instances" warning
let _supabase: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!_supabase) {
    _supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _supabase;
}

// Convenient named export used across the app
export const supabase = getSupabaseClient();
