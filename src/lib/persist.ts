import { formatRelativeTime } from './time';

export interface PersistedState<T> {
  get(): T;
  set(value: T): void;
  subscribe(listener: () => void): () => void;
}

interface Migration<T> {
  version: number;
  migrate(previous: unknown): T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<T>(defaults: T, value: unknown): T {
  if (value === undefined) return defaults;
  if (value === null) return value as T;

  if (Array.isArray(defaults)) {
    if (Array.isArray(value)) return value as T;
    return defaults;
  }

  if (isRecord(defaults)) {
    if (!isRecord(value)) return defaults;

    const result: Record<string, unknown> = { ...defaults };
    for (const key of Object.keys(value)) {
      if (key in defaults) {
        result[key] = deepMerge((defaults as Record<string, unknown>)[key], value[key]);
      } else {
        result[key] = value[key];
      }
    }
    return result as T;
  }

  return value as T;
}

export function createPersistedState<T>(
  key: string,
  defaultValue: T,
  migration?: Migration<T>,
): PersistedState<T> {
  let listeners: Array<() => void> = [];
  let cached: T | undefined;

  const notify = () => {
    for (const listener of listeners) listener();
  };

  const read = (): T => {
    if (cached !== undefined) return cached;
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) {
        cached = defaultValue;
        return defaultValue;
      }
      const parsed: unknown = JSON.parse(raw);
      const migrated = migration ? migration.migrate(parsed) : parsed;
      cached = deepMerge(defaultValue, migrated);
      return cached;
    } catch {
      cached = defaultValue;
      return defaultValue;
    }
  };

  const write = (value: T) => {
    cached = value;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      void 0;
    }
    notify();
  };

  return {
    get: read,
    set: write,
    subscribe(listener: () => void): () => void {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    },
  };
}
