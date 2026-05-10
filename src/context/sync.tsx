import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useSdk } from './sdk';
import type { Session, Event, GlobalEvent } from '@/types';

type SyncContextValue = {
  sessions: Session[];
  allSessions: Session[];
  loading: boolean;
  connected: boolean;
  createSession: (title?: string) => Promise<Session | undefined>;
  deleteSession: (id: string) => Promise<void>;
  updateSession: (id: string, updates: { title?: string }) => Promise<void>;
  archiveSession: (id: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
  refreshAllSessions: () => Promise<void>;
};

const SyncContext = createContext<SyncContextValue | null>(null);

function isSession(value: unknown): value is Session {
  return typeof value === 'object' && value !== null && 'id' in value && 'title' in value;
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { client } = useSdk();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  const refreshSessions = useCallback(async () => {
    try {
      const data = await client.session.list() as unknown[];
      const valid = data.filter(isSession);
      if (mountedRef.current) {
        setSessions(valid);
      }
    } catch {
      // ignore
    }
  }, [client]);

  const refreshAllSessions = useCallback(async () => {
    try {
      const data = await client.session.list({ scope: 'all' } as Parameters<typeof client.session.list>[0]) as unknown[];
      const valid = data.filter(isSession);
      if (mountedRef.current) {
        setAllSessions(valid);
      }
    } catch {
      // ignore
    }
  }, [client]);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    Promise.all([
      client.session.list()
        .then((data) => {
          if (!mountedRef.current) return;
          const valid = (data as unknown[]).filter(isSession);
          setSessions(valid);
        })
        .catch(() => {}),
      client.session.list({ scope: 'all' } as Parameters<typeof client.session.list>[0])
        .then((data) => {
          if (!mountedRef.current) return;
          const valid = (data as unknown[]).filter(isSession);
          setAllSessions(valid);
        })
        .catch(() => {}),
    ]).finally(() => {
      if (mountedRef.current) setLoading(false);
    });
    return () => {
      mountedRef.current = false;
    };
  }, [client]);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    let timeout: ReturnType<typeof setTimeout>;

    const connect = async () => {
      if (!mountedRef.current) return;
      try {
        const response = await client.global.event({ signal: controller.signal });
        if (!response.body || !response.ok) {
          throw new Error('No event stream body');
        }
        if (mountedRef.current) setConnected(true);
        retryCountRef.current = 0;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';

          for (const part of parts) {
            const dataLine = part.split('\n').find(l => l.startsWith('data: '));
            if (!dataLine) continue;
            try {
              const parsed = JSON.parse(dataLine.slice(6));
              handleEvent(parsed);
            } catch {
              // ignore parse errors
            }
          }
        }
      } catch {
        if (controller.signal.aborted) return;
        if (mountedRef.current) setConnected(false);
      }

      if (!mountedRef.current) return;
      retryCountRef.current = Math.min(retryCountRef.current + 1, 10);
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
      timeout = setTimeout(connect, delay);
    };

    connect();

    return () => {
      controller.abort();
      clearTimeout(timeout);
      setConnected(false);
    };
  }, [client]);

  function handleEvent(raw: GlobalEvent | Event) {
    retryCountRef.current = 0;
    const event = 'payload' in raw ? raw.payload : raw;
    if (!event || !('type' in event)) return;

    switch (event.type) {
      case 'session.created': {
        const info = (event as { type: string; properties: { info: Session } }).properties?.info;
        if (info && isSession(info)) {
          setSessions(prev => {
            if (prev.some(s => s.id === info.id)) return prev;
            return [info, ...prev];
          });
        }
        break;
      }
      case 'session.updated': {
        const info = (event as { type: string; properties: { info: Session } }).properties?.info;
        if (info && isSession(info)) {
          setSessions(prev => prev.map(s => s.id === info.id ? info : s));
        }
        break;
      }
      case 'session.deleted': {
        const info = (event as { type: string; properties: { info: Session } }).properties?.info;
        if (info) {
          setSessions(prev => prev.filter(s => s.id !== info.id));
        }
        break;
      }
    }
  }

  const createSession = useCallback(async (title?: string) => {
    const data = await client.session.create({
      body: title ? { title } : undefined,
    }) as unknown;
    const session = isSession(data) ? data : undefined;
    if (session) {
      setSessions(prev => [session, ...prev]);
    }
    return session;
  }, [client]);

  const deleteSession = useCallback(async (id: string) => {
    await client.session.delete(id);
    setSessions(prev => prev.filter(s => s.id !== id));
  }, [client]);

  const updateSession = useCallback(async (id: string, updates: { title?: string }) => {
    await client.session.update(id, { body: updates });
    setSessions(prev =>
      prev.map(s => s.id === id ? { ...s, ...updates } : s),
    );
  }, [client]);

  const archiveSession = useCallback(async (id: string) => {
    await client.session.update(id, { body: { time: { archived: Date.now() } } });
    setSessions(prev => prev.filter(s => s.id !== id));
  }, [client]);

  return (
    <SyncContext.Provider
      value={{
        sessions,
        allSessions,
        loading,
        connected,
        createSession,
        deleteSession,
        updateSession,
        archiveSession,
        refreshSessions,
        refreshAllSessions,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within SyncProvider');
  return ctx;
}
