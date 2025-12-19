/**
 * Supabase Client Configuration
 * Provides both browser and server clients
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { SUPABASE_URL, SUPABASE_ANON_KEY, getServiceRoleKey } from '@/lib/env';

// Browser client (safe to use in components)
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Server client with service role (use only in API routes)
export function createServerClient() {
  return createClient<Database>(SUPABASE_URL, getServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Export types
export type { Database };
