import { createContext, useContext, type ReactNode } from 'react';

export type PlatformAdapter = {
  notify: (title: string, body: string, onClick?: () => void) => void;
  openLink: (url: string) => void;
  goBack: () => void;
  goForward: () => void;
  restart: () => void;
  isMobile: boolean;
  isPWA: boolean;
};

const webPlatform: PlatformAdapter = {
  notify(title, body, onClick) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const n = new Notification(title, { body });
      if (onClick) n.onclick = onClick;
    }
  },
  openLink(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  },
  goBack() {
    window.history.back();
  },
  goForward() {
    window.history.forward();
  },
  restart() {
    window.location.reload();
  },
  get isMobile() {
    return window.innerWidth < 768;
  },
  get isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches;
  },
};

const PlatformContext = createContext<PlatformAdapter>(webPlatform);

export function PlatformProvider({ children }: { children: ReactNode }) {
  return <PlatformContext.Provider value={webPlatform}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  return useContext(PlatformContext);
}
