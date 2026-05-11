import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export type ServerConfig = {
  id: string;
  name: string;
  url: string;
  username?: string;
  password?: string;
};

export type ServerStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

type ServerContextValue = {
  servers: ServerConfig[];
  activeId: string | null;
  active: ServerConfig;
  status: ServerStatus;
  addServer: (config: Omit<ServerConfig, 'id'>) => string;
  removeServer: (id: string) => void;
  updateServer: (id: string, partial: Partial<Omit<ServerConfig, 'id'>>) => void;
  setActive: (id: string) => void;
  checkHealth: () => Promise<boolean>;
};

const ServerContext = createContext<ServerContextValue | null>(null);

const STORAGE_KEY = 'opencode-servers';

type StoredData = {
  servers: ServerConfig[];
  activeId: string | null;
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (
        typeof parsed === 'object' && parsed !== null &&
        'servers' in parsed && Array.isArray((parsed as StoredData).servers)
      ) {
        return parsed as StoredData;
      }
    }
  } catch {
    // ignore
  }
  return { servers: [], activeId: null };
}

function saveData(data: StoredData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function extractHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function createDefaultServer(): ServerConfig {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('auth_token');
  let username: string | undefined;
  let password: string | undefined;
  if (token) {
    try {
      const decoded = atob(token);
      const sep = decoded.indexOf(':');
      if (sep !== -1) {
        username = decoded.slice(0, sep);
        password = decoded.slice(sep + 1);
      }
    } catch {
      // ignore
    }
  }
  const url = `${window.location.protocol}//${window.location.host}`;
  return {
    id: generateId(),
    name: extractHost(url),
    url,
    username,
    password,
  };
}

export function ServerProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StoredData>(() => {
    const loaded = loadData();
    if (loaded.servers.length === 0) {
      const default_ = createDefaultServer();
      const initial: StoredData = { servers: [default_], activeId: default_.id };
      saveData(initial);
      return initial;
    }
    return loaded;
  });

  const [status, setStatus] = useState<ServerStatus>('connecting');

  // useState initializer above ensures servers.length > 0
  const active = data.servers.find(s => s.id === data.activeId) ?? data.servers[0]!;

  const checkHealth = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (active.username || active.password) {
        headers['Authorization'] = `Basic ${btoa(`${active.username ?? ''}:${active.password ?? ''}`)}`;
      }
      const resp = await fetch(`${active.url}/global/health`, { headers });
      if (resp.ok) {
        setStatus('connected');
        return true;
      }
    } catch {
      // ignore
    }
    setStatus('disconnected');
    return false;
  }, [active]);

  const addServer = useCallback((config: Omit<ServerConfig, 'id'>) => {
    const id = generateId();
    setData(prev => {
      const next: StoredData = {
        servers: [...prev.servers, { ...config, id }],
        activeId: prev.activeId,
      };
      saveData(next);
      return next;
    });
    return id;
  }, []);

  const removeServer = useCallback((id: string) => {
    setData(prev => {
      const servers = prev.servers.filter(s => s.id !== id);
      const activeId = prev.activeId === id
        ? (servers[0]?.id ?? null)
        : prev.activeId;
      const next: StoredData = { servers, activeId };
      saveData(next);
      return next;
    });
  }, []);

  const updateServer = useCallback((id: string, partial: Partial<Omit<ServerConfig, 'id'>>) => {
    setData(prev => {
      const servers = prev.servers.map(s =>
        s.id === id ? { ...s, ...partial } : s,
      );
      const next: StoredData = { ...prev, servers };
      saveData(next);
      return next;
    });
  }, []);

  const setActive = useCallback((id: string) => {
    const next: StoredData = { ...data, activeId: id };
    saveData(next);
    window.location.href = import.meta.env.BASE_URL;
  }, [data]);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30_000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return (
    <ServerContext.Provider value={{
      servers: data.servers,
      activeId: data.activeId,
      active,
      status,
      addServer,
      removeServer,
      updateServer,
      setActive,
      checkHealth,
    }}
    >
      {children}
    </ServerContext.Provider>
  );
}

export function useServer() {
  const ctx = useContext(ServerContext);
  if (!ctx) throw new Error('useServer must be used within ServerProvider');
  return ctx;
}
