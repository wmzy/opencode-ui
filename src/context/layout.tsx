import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type LayoutState = {
  sidebarOpen: boolean;
  sidebarWidth: number;
  sidePanelOpen: boolean;
  sidePanelTab: string;
  terminalOpen: boolean;
  terminalHeight: number;
  activeSessionId: string | null;
};

const defaultLayout: LayoutState = {
  sidebarOpen: true,
  sidebarWidth: 280,
  sidePanelOpen: false,
  sidePanelTab: 'files',
  terminalOpen: false,
  terminalHeight: 200,
  activeSessionId: null,
};

type LayoutContextValue = {
  layout: LayoutState;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  toggleSidePanel: () => void;
  setSidePanelTab: (tab: string) => void;
  toggleTerminal: () => void;
  setTerminalHeight: (height: number) => void;
  setActiveSession: (id: string | null) => void;
};

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [layout, setLayout] = useState<LayoutState>(() => {
    try {
      const stored = localStorage.getItem('opencode-layout');
      if (stored) return { ...defaultLayout, ...JSON.parse(stored) };
    } catch {
      // ignore
    }
    return defaultLayout;
  });

  const persist = (next: LayoutState) => {
    try {
      localStorage.setItem('opencode-layout', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const toggleSidebar = useCallback(() => {
    setLayout(prev => {
      const next = { ...prev, sidebarOpen: !prev.sidebarOpen };
      persist(next);
      return next;
    });
  }, []);

  const setSidebarWidth = useCallback((width: number) => {
    setLayout(prev => {
      const next = { ...prev, sidebarWidth: Math.max(200, Math.min(500, width)) };
      persist(next);
      return next;
    });
  }, []);

  const toggleSidePanel = useCallback(() => {
    setLayout(prev => {
      const next = { ...prev, sidePanelOpen: !prev.sidePanelOpen };
      persist(next);
      return next;
    });
  }, []);

  const setSidePanelTab = useCallback((tab: string) => {
    setLayout(prev => {
      const next = { ...prev, sidePanelTab: tab, sidePanelOpen: true };
      persist(next);
      return next;
    });
  }, []);

  const toggleTerminal = useCallback(() => {
    setLayout(prev => {
      const next = { ...prev, terminalOpen: !prev.terminalOpen };
      persist(next);
      return next;
    });
  }, []);

  const setTerminalHeight = useCallback((height: number) => {
    setLayout(prev => {
      const next = { ...prev, terminalHeight: Math.max(100, Math.min(600, height)) };
      persist(next);
      return next;
    });
  }, []);

  const setActiveSession = useCallback((id: string | null) => {
    setLayout(prev => ({ ...prev, activeSessionId: id }));
  }, []);

  return (
    <LayoutContext.Provider
      value={{
        layout,
        toggleSidebar,
        setSidebarWidth,
        toggleSidePanel,
        setSidePanelTab,
        toggleTerminal,
        setTerminalHeight,
        setActiveSession,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error('useLayout must be used within LayoutProvider');
  return ctx;
}
