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
  DEMO_ACCOUNTS,
  findDemoAccount,
  toFarmer,
  type Farmer,
  type LoginResult,
} from "@/lib/auth";
import { createLocalStore } from "@/lib/local-store";
import {
  getFarmData,
  setFarmData,
  subscribeFarmData,
} from "@/lib/farm-store";
import { isCloudEnabled, pullFarm, pushFarm, type CloudStatus } from "@/lib/cloud";
import { mergeFarmData } from "@/lib/cloud-merge";

const SETTINGS_KEY = "hjp.settings.v1";
const SESSION_KEY = "hjp.session.v1";

type Settings = {
  locale: Locale;
  currency: CurrencyCode;
  onboarded: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  locale: DEFAULT_LOCALE,
  currency: DEFAULT_CURRENCY,
  onboarded: false,
};

function parseSettings(raw: unknown): Settings {
  const saved = (raw ?? {}) as Partial<Settings>;
  return {
    locale: isLocale(saved.locale) ? saved.locale : DEFAULT_LOCALE,
    currency: isCurrency(saved.currency) ? saved.currency : DEFAULT_CURRENCY,
    onboarded: saved.onboarded === true,
  };
}

type Session = { farmerId?: string };

const settingsStore = createLocalStore(SETTINGS_KEY, DEFAULT_SETTINGS, parseSettings);
const sessionStore = createLocalStore<Session>(SESSION_KEY, {}, (raw) => {
  const saved = (raw ?? {}) as Session;
  return typeof saved.farmerId === "string"
    ? { farmerId: saved.farmerId }
    : {};
});

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
  completeOnboarding: (locale: Locale, currency: CurrencyCode) => void;
};

type AuthContextValue = {
  ready: boolean;
  user: Farmer | null;
  login: (phone: string, pin: string) => LoginResult;
  logout: () => void;
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

  const completeOnboarding = useCallback(
    (locale: Locale, currency: CurrencyCode) => {
      settingsStore.set({ locale, currency, onboarded: true });
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
      completeOnboarding,
    }),
    [settings, ready, setLocale, setCurrency, completeOnboarding],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// Demo-only auth: credentials live in the client bundle. Replace with a
// server session before handling real user data.
function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getSnapshot,
    sessionStore.getServerSnapshot,
  );
  const ready = useHydrated();
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>("local");

  const user = useMemo<Farmer | null>(() => {
    if (!session.farmerId) return null;
    const account = DEMO_ACCOUNTS.find(
      (item) => item.id === session.farmerId,
    );
    return account ? toFarmer(account) : null;
  }, [session.farmerId]);

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

  const login = useCallback((phone: string, pin: string): LoginResult => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7) return { ok: false, error: "phone" };
    if (!/^\d{4}$/.test(pin)) return { ok: false, error: "pin" };

    const account = findDemoAccount(phone, pin);
    if (!account) return { ok: false, error: "invalid" };

    sessionStore.set({ farmerId: account.id });
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    sessionStore.set({});
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      user,
      login,
      logout,
      cloudStatus: userId ? cloudStatus : "local",
    }),
    [ready, user, login, logout, userId, cloudStatus],
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
