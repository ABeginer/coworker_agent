import { createBrowserClient } from '@supabase/ssr';

export function getSupabaseEnv(): { supabaseUrl: string; supabaseAnonKey: string } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl.trim() === '') {
    throw new Error(
      'Missing environment variable: NEXT_PUBLIC_SUPABASE_URL is not set. Please add it to your .env.local file.'
    );
  }

  if (!supabaseAnonKey || supabaseAnonKey.trim() === '') {
    throw new Error(
      'Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Please add it to your .env.local file.'
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

let browserClientInstance: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Reusable Supabase browser client adhering to SSR best practices.
 */
export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  if (typeof window !== 'undefined') {
    if (!browserClientInstance) {
      browserClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
    }
    return browserClientInstance;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
