import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { useSdk } from './sdk';

const MAX_TERMINAL_SESSIONS = 20;

export type LocalPTY = {
  id: string;
  title: string;
  titleNumber: number;
  rows?: number;
  cols?: number;
  buffer?: string;
  scrollY?: number;
  cursor?: number;
};

type TerminalContextValue = {
  sessions: LocalPTY[];
  activeId: string | null;
  ready: boolean;
  directory: string | undefined;
  setDirectory: (dir: string | undefined) => void;
  create: () => Promise<string>;
  close: (id: string) => Promise<void>;
  open: (id: string) => void;
  update: (pty: Partial<LocalPTY> & { id: string }) => void;
  trim: (id: string) => void;
  trimAll: () => void;
};

type PersistedState = {
  active?: string;
  all: LocalPTY[];
};

function numberFromTitle(title: string): number | undefined {
  const match = title.match(/(\d+)/);
  if (!match) return undefined;
  const n = parseInt(match[1], 10);
  return Number.isFinite(n) && n > 0 && n <= MAX_TERMINAL_SESSIONS ? n : undefined;
}

function migrateState(value: unknown): PersistedState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { all: [] };
  }
  const rec = value as Record<string, unknown>;
  const seen = new Set<string>();
  const all: LocalPTY[] = (Array.isArray(rec.all) ? rec.all : []).flatMap(
    (item) => {
      if (typeof item !== 'object' || item === null || Array.isArray(item))
        return [];
      const obj = item as Record<string, unknown>;
      const id =
        typeof obj.id === 'string' ? obj.id : undefined;
      if (!id || seen.has(id)) return [];
      seen.add(id);
      const title = typeof obj.title === 'string' ? obj.title : '';
      const rawNum = typeof obj.titleNumber === 'number' ? obj.titleNumber : undefined;
      const titleNumber =
        rawNum && rawNum > 0
          ? rawNum
          : (numberFromTitle(title) ?? 0);
      const rows =
        typeof obj.rows === 'number' && Number.isFinite(obj.rows)
          ? obj.rows
          : undefined;
      const cols =
        typeof obj.cols === 'number' && Number.isFinite(obj.cols)
          ? obj.cols
          : undefined;
      const buffer =
        typeof obj.buffer === 'string' ? obj.buffer : undefined;
      const scrollY =
        typeof obj.scrollY === 'number' && Number.isFinite(obj.scrollY)
          ? obj.scrollY
          : undefined;
      const cursor =
        typeof obj.cursor === 'number' && Number.isFinite(obj.cursor)
          ? obj.cursor
          : undefined;
      return [
        {
          id,
          title,
          titleNumber,
          ...(rows !== undefined ? { rows } : {}),
          ...(cols !== undefined ? { cols } : {}),
          ...(buffer !== undefined ? { buffer } : {}),
          ...(scrollY !== undefined ? { scrollY } : {}),
          ...(cursor !== undefined ? { cursor } : {}),
        },
      ];
    },
  );
  const active =
    typeof rec.active === 'string' && seen.has(rec.active)
      ? rec.active
      : all[0]?.id;
  return { active, all };
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem('terminal');
    if (!raw) return { all: [] };
    return migrateState(JSON.parse(raw));
  } catch {
    // ignore
  }
  return { all: [] };
}

function saveState(sessions: LocalPTY[], activeId: string | null) {
  try {
    const data: PersistedState = { active: activeId ?? undefined, all: sessions };
    localStorage.setItem('terminal', JSON.stringify(data));
  } catch {
    // ignore
  }
}

const TerminalContext = createContext<TerminalContextValue | null>(null);

export function TerminalProvider({ children }: { children: ReactNode }) {
  const { client, getSdk } = useSdk();
  const [state, setState] = useState<PersistedState>(() => loadState());
  const [directory, setDirectory] = useState<string | undefined>(undefined);

  const sessions = state.all;
  const activeId = state.active ?? null;

  useEffect(() => {
    saveState(sessions, activeId);
  }, [sessions, activeId]);

  const pickNextNumber = useCallback((): number => {
    const existing = new Set<number>();
    for (const pty of sessions) {
      const direct =
        Number.isFinite(pty.titleNumber) && pty.titleNumber > 0
          ? pty.titleNumber
          : undefined;
      if (direct !== undefined) {
        existing.add(direct);
      } else {
        const parsed = numberFromTitle(pty.title);
        if (parsed !== undefined) existing.add(parsed);
      }
    }
    return (
      Array.from({ length: existing.size + 1 }, (_, i) => i + 1).find(
        (n) => !existing.has(n),
      ) ?? 1
    );
  }, [sessions]);

  const create = useCallback(async (): Promise<string> => {
    const nextNumber = pickNextNumber();
    const scopedClient = directory ? getSdk(directory) : client;
    const result = (await scopedClient.pty.create({
      body: { title: `Terminal ${nextNumber}` },
    })) as { id: string; title?: string };
    const id = result.id;
    const newPty: LocalPTY = {
      id,
      title: result.title ?? `Terminal ${nextNumber}`,
      titleNumber: nextNumber,
    };
    setState((prev) => {
      const all =
        prev.all.length >= MAX_TERMINAL_SESSIONS
          ? [...prev.all.slice(1), newPty]
          : [...prev.all, newPty];
      return { ...prev, all, active: id };
    });
    return id;
  }, [client, getSdk, directory, pickNextNumber]);

  const close = useCallback(
    async (id: string) => {
      setState((prev) => {
        const index = prev.all.findIndex((p) => p.id === id);
        if (index === -1) return prev;
        const next = { ...prev, all: prev.all.filter((p) => p.id !== id) };
        if (prev.active === id) {
          next.active =
            index > 0
              ? prev.all[index - 1]?.id
              : next.all[0]?.id;
        }
        return next;
      });
      const scopedClient = directory ? getSdk(directory) : client;
      void scopedClient.pty.remove(id).catch(() => {
        // ignore
      });
    },
    [client, getSdk, directory],
  );

  const open = useCallback((id: string) => {
    setState((prev) => ({ ...prev, active: id }));
  }, []);

  const update = useCallback(
    (pty: Partial<LocalPTY> & { id: string }) => {
      setState((prev) => {
        const index = prev.all.findIndex((p) => p.id === pty.id);
        if (index === -1) return prev;
        const all = prev.all.map((p, i) =>
          i === index ? { ...p, ...pty } : p,
        );
        return { ...prev, all };
      });
      const { id, ...rest } = pty;
      const size =
        rest.cols && rest.rows
          ? { rows: rest.rows, cols: rest.cols }
          : undefined;
      const scopedClient = directory ? getSdk(directory) : client;
      void scopedClient.pty
        .update(id, { body: { title: rest.title, size } })
        .catch(() => {
          // ignore
        });
    },
    [client, getSdk, directory],
  );

  const trim = useCallback((id: string) => {
    setState((prev) => {
      const index = prev.all.findIndex((p) => p.id === id);
      if (index === -1) return prev;
      const pty = prev.all[index];
      if (
        pty.buffer === undefined &&
        pty.cursor === undefined &&
        pty.scrollY === undefined
      )
        return prev;
      const all = prev.all.map((p, i) =>
        i === index
          ? { ...p, buffer: undefined, cursor: undefined, scrollY: undefined }
          : p,
      );
      return { ...prev, all };
    });
  }, []);

  const trimAll = useCallback(() => {
    setState((prev) => {
      const all = prev.all.map((pty) => {
        if (
          pty.buffer === undefined &&
          pty.cursor === undefined &&
          pty.scrollY === undefined
        )
          return pty;
        return {
          ...pty,
          buffer: undefined,
          cursor: undefined,
          scrollY: undefined,
        };
      });
      if (all.every((p, i) => p === prev.all[i])) return prev;
      return { ...prev, all };
    });
  }, []);

  const ready = true;

  const value = useMemo<TerminalContextValue>(
    () => ({
      sessions,
      activeId,
      ready,
      directory,
      setDirectory,
      create,
      close,
      open,
      update,
      trim,
      trimAll,
    }),
    [sessions, activeId, ready, directory, create, close, open, update, trim, trimAll],
  );

  return (
    <TerminalContext.Provider value={value}>
      {children}
    </TerminalContext.Provider>
  );
}

export function useTerminals() {
  const ctx = useContext(TerminalContext);
  if (!ctx) throw new Error('useTerminals must be used within TerminalProvider');
  return ctx;
}
