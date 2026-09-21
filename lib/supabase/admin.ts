import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service role key.
 *
 * IMPORTANT: Never import this file into a "use client" component or
 * ship the service role key to the browser. Only use this inside
 * server actions ("use server") or route handlers.
 *
 * If you already have an equivalent admin client helper (the one your
 * createClassAdvisor action uses), delete this file and point the
 * imports in actions.ts / route.ts at your existing helper instead.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}