"use client";

export type LocalStore<T> = {
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  subscribe: (listener: () => void) => () => void;
  set: (value: T) => void;
};

export function createLocalStore<T>(
  key: string,
  fallback: T,
  parse: (raw: unknown) => T,
): LocalStore<T> {
  let cached: T | undefined;
  const listeners = new Set<() => void>();

  function read(): T {
    if (cached !== undefined) return cached;
    try {
      const raw = window.localStorage.getItem(key);
      cached = raw ? parse(JSON.parse(raw)) : fallback;
    } catch {
      cached = fallback;
    }
    return cached;
  }

  return {
    getSnapshot: read,
    getServerSnapshot: () => fallback,
    subscribe: (listener) => {
      listeners.add(listener);

      const onStorage = (event: StorageEvent) => {
        if (event.key !== key) return;
        cached = undefined;
        listener();
      };

      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
    set: (value) => {
      cached = value;
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* storage can be unavailable in private mode */
      }
      listeners.forEach((listener) => listener());
    },
  };
}
