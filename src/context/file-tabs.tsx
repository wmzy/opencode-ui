import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';

export type FileTab = {
  path: string;
};

type FileTabsContextValue = {
  tabs: FileTab[];
  activePath: string | null;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string | null) => void;
  closeAll: () => void;
};

const FileTabsContext = createContext<FileTabsContextValue | null>(null);

export function FileTabsProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<FileTab[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);

  const openFile = useCallback((path: string) => {
    setTabs((prev) => {
      const exists = prev.some((t) => t.path === path);
      if (!exists) {
        return [...prev, { path }];
      }
      return prev;
    });
    setActivePath(path);
  }, []);

  const closeFile = useCallback((path: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.path === path);
      if (idx === -1) return prev;
      const next = prev.filter((t) => t.path !== path);
      return next;
    });
    setActivePath((prevActive) => {
      if (prevActive === path) {
        const remaining = tabs.filter((t) => t.path !== path);
        if (remaining.length === 0) return null;
        const idx = tabs.findIndex((t) => t.path === path);
        const nextIdx = Math.min(idx, remaining.length - 1);
        return remaining[nextIdx].path;
      }
      return prevActive;
    });
  }, [tabs]);

  const setActiveFile = useCallback((path: string | null) => {
    setActivePath(path);
  }, []);

  const closeAll = useCallback(() => {
    setTabs([]);
    setActivePath(null);
  }, []);

  return (
    <FileTabsContext.Provider
      value={{ tabs, activePath, openFile, closeFile, setActiveFile, closeAll }}
    >
      {children}
    </FileTabsContext.Provider>
  );
}

export function useFileTabs() {
  const ctx = useContext(FileTabsContext);
  if (!ctx) throw new Error('useFileTabs must be used within FileTabsProvider');
  return ctx;
}

/** Non-throwing version — returns null when outside a provider. */
export function useOptionalFileTabs() {
  return useContext(FileTabsContext);
}
