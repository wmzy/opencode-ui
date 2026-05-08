import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { DesktopTheme } from '@/themes/types';
import { applyThemeForMode, loadTheme, getThemeIds, THEME_NAMES } from '@/themes/loader';

export type ColorScheme = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  themeId: string;
  colorScheme: ColorScheme;
  mode: 'light' | 'dark';
  ids: () => string[];
  name: (id: string) => string;
  themes: () => Record<string, DesktopTheme>;
  setTheme: (id: string) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  loadThemes: () => Promise<Record<string, DesktopTheme>>;
  previewTheme: (id: string) => void;
  previewColorScheme: (scheme: ColorScheme) => void;
  cancelPreview: () => void;
  commitPreview: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEYS = {
  THEME_ID: 'opencode-theme-id',
  COLOR_SCHEME: 'opencode-color-scheme',
} as const;

function getSystemMode(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(() => readStorage(STORAGE_KEYS.THEME_ID) ?? 'oc-2');
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(
    () => (readStorage(STORAGE_KEYS.COLOR_SCHEME) as ColorScheme | null) ?? 'system',
  );
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const scheme = (readStorage(STORAGE_KEYS.COLOR_SCHEME) as ColorScheme | null) ?? 'system';
    return scheme === 'system' ? getSystemMode() : scheme;
  });

  const themesRef = useRef<Record<string, DesktopTheme>>({});
  const [, forceUpdate] = useState(0);
  const previewRef = useRef<{ themeId: string | null; colorScheme: ColorScheme | null }>({
    themeId: null,
    colorScheme: null,
  });

  const ensureTheme = useCallback(async (id: string): Promise<DesktopTheme | undefined> => {
    if (themesRef.current[id]) return themesRef.current[id];
    const theme = await loadTheme(id);
    if (theme) {
      themesRef.current[id] = theme;
      forceUpdate(n => n + 1);
    }
    return theme;
  }, []);

  useEffect(() => {
    void ensureTheme(themeId);
  }, [themeId, ensureTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const currentScheme = previewRef.current.colorScheme ?? colorScheme;
      if (currentScheme === 'system') {
        setMode(getSystemMode());
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [colorScheme]);

  useEffect(() => {
    const effectiveId = previewRef.current.themeId ?? themeId;
    const effectiveScheme = previewRef.current.colorScheme ?? colorScheme;
    const effectiveMode = effectiveScheme === 'system' ? getSystemMode() : effectiveScheme;

    void ensureTheme(effectiveId).then(theme => {
      if (!theme) return;
      applyThemeForMode(theme, effectiveId, effectiveMode);
    });
  }, [themeId, colorScheme, mode, ensureTheme]);

  const ids = useCallback(() => getThemeIds(), []);

  const name = useCallback(
    (id: string) => themesRef.current[id]?.name ?? THEME_NAMES[id] ?? id,
    [],
  );

  const themes = useCallback(() => themesRef.current, []);

  const loadThemes = useCallback(async (): Promise<Record<string, DesktopTheme>> => {
    const allIds = getThemeIds();
    await Promise.all(allIds.map(id => ensureTheme(id)));
    return themesRef.current;
  }, [ensureTheme]);

  const setTheme = useCallback((id: string) => {
    previewRef.current.themeId = null;
    setThemeId(id);
    writeStorage(STORAGE_KEYS.THEME_ID, id);
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    previewRef.current.colorScheme = null;
    setColorSchemeState(scheme);
    writeStorage(STORAGE_KEYS.COLOR_SCHEME, scheme);
    setMode(scheme === 'system' ? getSystemMode() : scheme);
  }, []);

  const previewTheme = useCallback(
    (id: string) => {
      previewRef.current.themeId = id;
      forceUpdate(n => n + 1);
      void ensureTheme(id).then(theme => {
        if (!theme) return;
        const effectiveScheme = previewRef.current.colorScheme ?? colorScheme;
        const effectiveMode = effectiveScheme === 'system' ? getSystemMode() : effectiveScheme;
        applyThemeForMode(theme, id, effectiveMode);
      });
    },
    [colorScheme, ensureTheme],
  );

  const previewColorScheme = useCallback(
    (scheme: ColorScheme) => {
      previewRef.current.colorScheme = scheme;
      forceUpdate(n => n + 1);
      const effectiveMode = scheme === 'system' ? getSystemMode() : scheme;
      const effectiveId = previewRef.current.themeId ?? themeId;
      void ensureTheme(effectiveId).then(theme => {
        if (!theme) return;
        applyThemeForMode(theme, effectiveId, effectiveMode);
      });
    },
    [themeId, ensureTheme],
  );

  const cancelPreview = useCallback(() => {
    previewRef.current = { themeId: null, colorScheme: null };
    forceUpdate(n => n + 1);
    const effectiveMode = colorScheme === 'system' ? getSystemMode() : colorScheme;
    void ensureTheme(themeId).then(theme => {
      if (!theme) return;
      applyThemeForMode(theme, themeId, effectiveMode);
    });
  }, [themeId, colorScheme, ensureTheme]);

  const commitPreview = useCallback(() => {
    if (previewRef.current.themeId) {
      setTheme(previewRef.current.themeId);
    }
    if (previewRef.current.colorScheme) {
      setColorScheme(previewRef.current.colorScheme);
    }
    previewRef.current = { themeId: null, colorScheme: null };
  }, [setTheme, setColorScheme]);

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        colorScheme,
        mode,
        ids,
        name,
        themes,
        setTheme,
        setColorScheme,
        loadThemes,
        previewTheme,
        previewColorScheme,
        cancelPreview,
        commitPreview,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
