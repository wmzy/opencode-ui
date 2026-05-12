import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type ColorScheme = 'system' | 'light' | 'dark';

export type Settings = {
  theme: string;
  colorScheme: ColorScheme;
  language: string;
  sounds: boolean;
  notifications: boolean;
  sidebarCollapsed: boolean;
  fontSize: number;
  shell: string;
  autoAcceptPermissions: boolean;
  reasoningSummaries: boolean;
  expandShellOutput: boolean;
  expandEditDiffs: boolean;
  uiFont: string;
  codeFont: string;
  terminalFont: string;
  agentNotifications: boolean;
  permissionNotifications: boolean;
  errorNotifications: boolean;
  agentSound: string;
  errorSound: string;
};

const defaultSettings: Settings = {
  theme: 'default',
  colorScheme: 'system',
  language: 'en',
  sounds: false,
  notifications: true,
  sidebarCollapsed: false,
  fontSize: 14,
  shell: '',
  autoAcceptPermissions: false,
  reasoningSummaries: true,
  expandShellOutput: false,
  expandEditDiffs: false,
  uiFont: '',
  codeFont: '',
  terminalFont: '',
  agentNotifications: true,
  permissionNotifications: true,
  errorNotifications: true,
  agentSound: 'default',
  errorSound: 'default',
};

type SettingsContextValue = {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  resetSettings: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

const STORAGE_KEY = 'opencode-settings';

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch {
    // ignore
  }
  return defaultSettings;
}

function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
  }, []);

  useEffect(() => {
    const scheme = settings.colorScheme;
    const isDark =
      scheme === 'dark' ||
      (scheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [settings.colorScheme]);

  useEffect(() => {
    try {
      localStorage.setItem('opencode-locale', settings.language);
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent('opencode-locale-change', { detail: settings.language }));
  }, [settings.language]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
