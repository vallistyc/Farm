"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import {
  DEFAULT_LOCALE,
  dictionaries,
  isLocale,
  type Dictionary,
  type Locale,
} from "@/i18n";
import {
  DEFAULT_CURRENCY,
  isCurrency,
  type CurrencyCode,
} from "@/lib/currency";
import {
  DEFAULT_COUNTRY,
  countryCurrency,
  isMarketCountry,
  type MarketCountry,
} from "@/lib/market-context";
import {
  classifyAuthError,
  toFarmer,
  type AuthResult,
  type Farmer,
  type RegisterResult,
} from "@/lib/auth";
import { authRedirectUrl, getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { createLocalStore } from "@/lib/local-store";
import {
  getFarmData,
  setFarmData,
  subscribeFarmData,
} from "@/lib/farm-store";
import { isCloudEnabled, pullFarm, pushFarm, type CloudStatus } from "@/lib/cloud";
import { mergeFarmData } from "@/lib/cloud-merge";

const SETTINGS_KEY = "hjp.settings.v1";

type Settings = {
  locale: Locale;
  currency: CurrencyCode;
  country: MarketCountry;
  onboarded: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  locale: DEFAULT_LOCALE,
  currency: DEFAULT_CURRENCY,
  country: DEFAULT_COUNTRY,
  onboarded: false,
};

function parseSettings(raw: unknown): Settings {
  const saved = (raw ?? {}) as Partial<Settings>;
  const currency = isCurrency(saved.currency)
    ? saved.currency
    : DEFAULT_CURRENCY;
  return {
    locale: isLocale(saved.locale) ? saved.locale : DEFAULT_LOCALE,
    currency,
    country: isMarketCountry(saved.country)
      ? saved.country
      : currency === "IDR"
        ? "ID"
        : DEFAULT_COUNTRY,
    onboarded: saved.onboarded === true,
  };
}

const settingsStore = createLocalStore(SETTINGS_KEY, DEFAULT_SETTINGS, parseSettings);

const noopSubscribe = () => () => {};
const hydratedSnapshot = () => true;
const serverHydratedSnapshot = () => false;

function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    hydratedSnapshot,
    serverHydratedSnapshot,
  );
}

type SettingsContextValue = Settings & {
  ready: boolean;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setCountry: (country: MarketCountry) => void;
  completeOnboarding: (locale: Locale, country: MarketCountry) => void;
};

type AuthContextValue = {
  ready: boolean;
  user: Farmer | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (input: {
    name: string;
    region: string;
    email: string;
    password: string;
  }) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  cloudStatus: CloudStatus;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);
const AuthContext = createContext<AuthContextValue | null>(null);

function SettingsProvider({ children }: { children: ReactNode }) {
  const settings = useSyncExternalStore(
    settingsStore.subscribe,
    settingsStore.getSnapshot,
    settingsStore.getServerSnapshot,
  );
  const ready = useHydrated();

  useEffect(() => {
    document.documentElement.lang = settings.locale;
  }, [settings.locale]);

  const setLocale = useCallback((locale: Locale) => {
    settingsStore.set({ ...settingsStore.getSnapshot(), locale });
  }, []);

  const setCurrency = useCallback((currency: CurrencyCode) => {
    settingsStore.set({ ...settingsStore.getSnapshot(), currency });
  }, []);

  const setCountry = useCallback((country: MarketCountry) => {
    settingsStore.set({
      ...settingsStore.getSnapshot(),
      country,
      currency: countryCurrency(country),
    });
  }, []);

  const completeOnboarding = useCallback(
    (locale: Locale, country: MarketCountry) => {
      settingsStore.set({
        locale,
        country,
        currency: countryCurrency(country),
        onboarded: true,
      });
    },
    [],
  );

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...settings,
      ready,
      t: dictionaries[settings.locale],
      setLocale,
      setCurrency,
      setCountry,
      completeOnboarding,
    }),
    [settings, ready, setLocale, setCurrency, setCountry, completeOnboarding],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// Supabase Auth (email + password). The session is owned by supabase-js
// (persisted + auto-refreshed); this provider mirrors it into `user`.
function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Farmer | null>(null);
  const [ready, setReady] = useState(() => !isSupabaseConfigured);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>("local");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabase();

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session ? toFarmer(data.session.user) : null);
      setReady(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session: Session | null) => {
        setUser(session ? toFarmer(session.user) : null);
        setReady(true);
      },
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const userId = user?.id;

  useEffect(() => {
    if (!userId || !isCloudEnabled()) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const sync = async () => {
      setCloudStatus("syncing");
      try {
        const remote = await pullFarm(userId);
        if (cancelled) return;
        const merged = mergeFarmData(getFarmData(userId), remote);
        if (merged.fields.length > 0 || merged.crops.length > 0) {
          setFarmData(userId, merged);
        } else if (!cancelled) {
          setCloudStatus("synced");
        }
      } catch {
        if (!cancelled) setCloudStatus("error");
      }
    };

    const unsubscribe = subscribeFarmData(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const data = getFarmData(userId);
        if (!data) return;
        pushFarm(userId, data)
          .then(() => {
            if (!cancelled) setCloudStatus("synced");
          })
          .catch(() => {
            if (!cancelled) setCloudStatus("error");
          });
      }, 800);
    });

    void sync();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [userId]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!isSupabaseConfigured) return { ok: false, error: "notConfigured" };
      const { error } = await getSupabase().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        return { ok: false, error: classifyAuthError(error), detail: error.message };
      }
      return { ok: true };
    },
    [],
  );

  const register = useCallback(
    async (input: {
      name: string;
      region: string;
      email: string;
      password: string;
    }): Promise<RegisterResult> => {
      if (!isSupabaseConfigured) return { ok: false, error: "notConfigured" };
      const { data, error } = await getSupabase().auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: {
          data: { name: input.name.trim(), region: input.region.trim() },
          emailRedirectTo: authRedirectUrl(),
        },
      });
      if (error) {
        return { ok: false, error: classifyAuthError(error), detail: error.message };
      }
      // When email confirmation is on, signUp returns a user but no session.
      const needsConfirm = !data.session;
      return { ok: true, needsConfirm };
    },
    [],
  );

  const logout = useCallback(async () => {
    if (isSupabaseConfigured) {
      await getSupabase().auth.signOut();
    }
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      user,
      login,
      register,
      logout,
      cloudStatus: userId ? cloudStatus : "local",
    }),
    [ready, user, login, register, logout, userId, cloudStatus],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <AuthProvider>{children}</AuthProvider>
    </SettingsProvider>
  );
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("useSettings must be used inside AppProviders");
  return value;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AppProviders");
  return value;
}
