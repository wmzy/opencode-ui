import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export type ServerConnection = {
  type: 'http';
  url: string;
  username?: string;
  password?: string;
  authToken?: boolean;
};

export type ServerStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

type ServerState = {
  connections: ServerConnection[];
  activeIndex: number;
  status: ServerStatus;
  lastHealthCheck: number | null;
};

type ServerContextValue = {
  state: ServerState;
  active: ServerConnection;
  status: ServerStatus;
  addConnection: (conn: ServerConnection) => void;
  removeConnection: (index: number) => void;
  setActive: (index: number) => void;
  checkHealth: () => Promise<boolean>;
};

const ServerContext = createContext<ServerContextValue | null>(null);

function authFromToken(token: string | null): { username: string; password: string } | undefined {
  if (!token) return undefined;
  try {
    const decoded = atob(token);
    const sep = decoded.indexOf(':');
    if (sep === -1) return undefined;
    return { username: decoded.slice(0, sep), password: decoded.slice(sep + 1) };
  } catch {
    return undefined;
  }
}

function getInitialConnection(): ServerConnection {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('auth_token');
  const auth = authFromToken(token);
  const url = `${window.location.protocol}//${window.location.host}`;
  return {
    type: 'http',
    url,
    ...auth,
    authToken: !!auth,
  };
}

export function ServerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ServerState>(() => ({
    connections: [getInitialConnection()],
    activeIndex: 0,
    status: 'connecting',
    lastHealthCheck: null,
  }));

  const active = state.connections[state.activeIndex];

  const checkHealth = useCallback(async () => {
    try {
      const resp = await fetch(`${active.url}/global/health`);
      if (resp.ok) {
        setState(s => ({ ...s, status: 'connected', lastHealthCheck: Date.now() }));
        return true;
      }
    } catch {
      // ignore
    }
    setState(s => ({ ...s, status: 'disconnected' }));
    return false;
  }, [active.url]);

  const addConnection = useCallback((conn: ServerConnection) => {
    setState(s => ({ ...s, connections: [...s.connections, conn] }));
  }, []);

  const removeConnection = useCallback((index: number) => {
    setState(s => {
      const connections = s.connections.filter((_, i) => i !== index);
      const activeIndex = Math.min(s.activeIndex, connections.length - 1);
      return { ...s, connections, activeIndex };
    });
  }, []);

  const setActive = useCallback((index: number) => {
    setState(s => ({ ...s, activeIndex: index, status: 'connecting' }));
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30_000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return (
    <ServerContext.Provider value={{ state, active, status: state.status, addConnection, removeConnection, setActive, checkHealth }}>
      {children}
    </ServerContext.Provider>
  );
}

export function useServer() {
  const ctx = useContext(ServerContext);
  if (!ctx) throw new Error('useServer must be used within ServerProvider');
  return ctx;
}
