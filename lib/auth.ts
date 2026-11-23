import type { AuthError as SupabaseAuthError, User } from "@supabase/supabase-js";

export type Farmer = {
  id: string;
  name: string;
  email: string;
  region: string;
};

export type AuthError =
  | "email"
  | "password"
  | "name"
  | "region"
  | "invalid"
  | "exists"
  | "notConfigured"
  | "network"
  | "unknown";

export type AuthResult =
  | { ok: true }
  | { ok: false; error: AuthError; detail?: string };

export type RegisterResult =
  | { ok: true; needsConfirm: boolean }
  | { ok: false; error: AuthError; detail?: string };

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Maps a Supabase auth user to the app's Farmer shape (name/region from metadata). */
export function toFarmer(user: User): Farmer {
  const meta = (user.user_metadata ?? {}) as {
    name?: string;
    region?: string;
  };
  const email = user.email ?? "";
  const fallbackName = email ? email.split("@")[0] : "Petani";
  return {
    id: user.id,
    email,
    name: meta.name?.trim() || fallbackName,
    region: meta.region?.trim() ?? "",
  };
}

/** Classifies a supabase-js auth error into an app-level AuthError. */
export function classifyAuthError(error: SupabaseAuthError): AuthError {
  const message = error.message ?? "";
  const name = error.name ?? "";
  if (
    name === "FetchError" ||
    /failed to fetch|networkerror|fetch failed|network request/i.test(message)
  ) {
    return "network";
  }
  if (/already registered|already exists|user already/i.test(message)) {
    return "exists";
  }
  if (/invalid login credentials|invalid email or password/i.test(message)) {
    return "invalid";
  }
  return "unknown";
}
