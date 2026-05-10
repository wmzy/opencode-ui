import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from 'react';
import { useGlobalSync } from './global-sync';

type NotificationBase = {
  directory?: string;
  session?: string;
  time: number;
  viewed: boolean;
};

type TurnCompleteNotification = NotificationBase & {
  type: 'turn-complete';
};

type ErrorNotification = NotificationBase & {
  type: 'error';
  error?: unknown;
};

export type AppNotification = TurnCompleteNotification | ErrorNotification;

type NotificationContextValue = {
  session: {
    unseenCount: (sessionId: string) => number;
    unseenHasError: (sessionId: string) => boolean;
    markViewed: (sessionId: string) => void;
  };
  project: {
    unseenCount: (directory: string) => number;
    unseenHasError: (directory: string) => boolean;
    markViewed: (directory: string) => void;
  };
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

const MAX_NOTIFICATIONS = 500;
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

function prune(list: AppNotification[]): AppNotification[] {
  const cutoff = Date.now() - TTL_MS;
  const pruned = list.filter(n => n.time >= cutoff);
  return pruned.length > MAX_NOTIFICATIONS
    ? pruned.slice(pruned.length - MAX_NOTIFICATIONS)
    : pruned;
}

type SessionIndex = {
  unseenCount: number;
  hasError: boolean;
};

function buildIndex(notifications: AppNotification[]) {
  const bySession = new Map<string, SessionIndex>();
  const byProject = new Map<string, SessionIndex>();

  for (const n of notifications) {
    if (!n.viewed) {
      if (n.session) {
        const cur = bySession.get(n.session) ?? { unseenCount: 0, hasError: false };
        cur.unseenCount++;
        if (n.type === 'error') cur.hasError = true;
        bySession.set(n.session, cur);
      }
      if (n.directory) {
        const cur = byProject.get(n.directory) ?? { unseenCount: 0, hasError: false };
        cur.unseenCount++;
        if (n.type === 'error') cur.hasError = true;
        byProject.set(n.directory, cur);
      }
    }
  }

  return { bySession, byProject };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { state } = useGlobalSync();
  const listRef = useRef<AppNotification[]>([]);
  const [revision, setRevision] = useState(0);
  const bump = useCallback(() => setRevision(r => r + 1), []);

  const index = useMemo(() => buildIndex(listRef.current), [revision]);

  useEffect(() => {
    const statusMap = state.sessionStatus;
    const statusEntries = Array.from(statusMap.entries());
    let changed = false;

    for (const [sessionId, status] of statusEntries) {
      if (status.type === 'idle') {
        const alreadyHas = listRef.current.some(
          n => n.session === sessionId && n.type === 'turn-complete' && !n.viewed,
        );
        if (!alreadyHas) {
          listRef.current = prune([
            ...listRef.current,
            {
              type: 'turn-complete',
              session: sessionId,
              time: Date.now(),
              viewed: false,
            },
          ]);
          changed = true;
        }
      }
    }

    if (changed) bump();
  }, [state.sessionStatus, bump]);

  const markSessionViewed = useCallback((sessionId: string) => {
    let changed = false;
    listRef.current = listRef.current.map(n => {
      if (n.session === sessionId && !n.viewed) {
        changed = true;
        return { ...n, viewed: true };
      }
      return n;
    });
    if (changed) bump();
  }, [bump]);

  const markProjectViewed = useCallback((directory: string) => {
    let changed = false;
    listRef.current = listRef.current.map(n => {
      if (n.directory === directory && !n.viewed) {
        changed = true;
        return { ...n, viewed: true };
      }
      return n;
    });
    if (changed) bump();
  }, [bump]);

  const value = useMemo<NotificationContextValue>(() => ({
    session: {
      unseenCount: (sessionId: string) => index.bySession.get(sessionId)?.unseenCount ?? 0,
      unseenHasError: (sessionId: string) => index.bySession.get(sessionId)?.hasError ?? false,
      markViewed: markSessionViewed,
    },
    project: {
      unseenCount: (directory: string) => index.byProject.get(directory)?.unseenCount ?? 0,
      unseenHasError: (directory: string) => index.byProject.get(directory)?.hasError ?? false,
      markViewed: markProjectViewed,
    },
    // revision is the reactive trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [index, markSessionViewed, markProjectViewed, revision]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
