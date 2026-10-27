import { createBrowserClient } from '@supabase/ssr';

export function getSupabaseEnv(): { supabaseUrl: string; supabasePublishableKey: string } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || supabaseUrl.trim() === '') {
    throw new Error(
      'Missing environment variable: NEXT_PUBLIC_SUPABASE_URL is not set. Please add it to your .env.local file.'
    );
  }

  if (!supabasePublishableKey || supabasePublishableKey.trim() === '') {
    throw new Error(
      'Missing environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set. Please add it to your .env.local file.'
    );
  }

  return { supabaseUrl, supabasePublishableKey };
}

let browserClientInstance: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Reusable Supabase browser client adhering to SSR best practices.
 */
export function createClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnv();

  if (typeof window !== 'undefined') {
    if (!browserClientInstance) {
      browserClientInstance = createBrowserClient(supabaseUrl, supabasePublishableKey);
    }
    return browserClientInstance;
  }

  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
