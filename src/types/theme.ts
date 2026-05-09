export type ThemeVariant = 'light' | 'dark' | 'system';

export type ColorScheme = {
  name: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    muted: string;
    accent: string;
    destructive: string;
    border: string;
    card: string;
    cardForeground: string;
    input: string;
    ring: string;
  };
};
