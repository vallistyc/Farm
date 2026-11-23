import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "") ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

/** True when both public Supabase variables are present. */
export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/**
 * Browser Supabase client. Uses the public anon key only; the session is
 * persisted by supabase-js in localStorage and refreshed automatically. Created
 * lazily so an unconfigured (local-only) build never throws at import time.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}

/**
 * Where Supabase should land the user after they confirm their email.
 * Prefers the configured public site URL (production), else the current
 * origin (so local dev still works). Must be an allowed Redirect URL in the
 * Supabase dashboard, otherwise Supabase falls back to its Site URL.
 */
export function authRedirectUrl(): string | undefined {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  const base = configured ||
    (typeof window !== "undefined" ? window.location.origin.replace(/\/+$/, "") : "");
  if (!base) return undefined;
  return `${base}/home`;
}

/** Current signed-in access token, or null when there is no session. */
export async function getAccessToken(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await getSupabase().auth.getSession();
  return data.session?.access_token ?? null;
}
