import type { DesktopTheme, ResolvedTheme } from './types';
import { resolveThemeVariant, themeToCss } from './resolve';

const THEME_STYLE_ID = 'opencode-theme';

function ensureStyleElement(): HTMLStyleElement {
  const existing = document.getElementById(THEME_STYLE_ID) as HTMLStyleElement | null;
  if (existing) return existing;
  const element = document.createElement('style');
  element.id = THEME_STYLE_ID;
  document.head.appendChild(element);
  return element;
}

function buildThemeCss(light: ResolvedTheme, dark: ResolvedTheme, themeId: string): string {
  const isDefaultTheme = themeId === 'oc-2';
  const lightCss = themeToCss(light);
  const darkCss = themeToCss(dark);

  if (isDefaultTheme) {
    return `
:root {
  color-scheme: light;
  --text-mix-blend-mode: multiply;

  ${lightCss}

  @media (prefers-color-scheme: dark) {
    color-scheme: dark;
    --text-mix-blend-mode: plus-lighter;

    ${darkCss}
  }
}
`;
  }

  return `
html[data-theme="${themeId}"] {
  color-scheme: light;
  --text-mix-blend-mode: multiply;

  ${lightCss}

  @media (prefers-color-scheme: dark) {
    color-scheme: dark;
    --text-mix-blend-mode: plus-lighter;

    ${darkCss}
  }
}
`;
}

export function applyTheme(theme: DesktopTheme, themeId?: string): void {
  const lightTokens = resolveThemeVariant(theme.light, false);
  const darkTokens = resolveThemeVariant(theme.dark, true);
  const targetThemeId = themeId ?? theme.id;
  const css = buildThemeCss(lightTokens, darkTokens, targetThemeId);
  ensureStyleElement().textContent = css;
  document.documentElement.setAttribute('data-theme', targetThemeId);
}

export function applyThemeForMode(theme: DesktopTheme, themeId: string, mode: 'light' | 'dark'): void {
  const isDark = mode === 'dark';
  const variant = isDark ? theme.dark : theme.light;
  const tokens = resolveThemeVariant(variant, isDark);
  const css = themeToCss(tokens);
  const fullCss = `:root {
  color-scheme: ${mode};
  --text-mix-blend-mode: ${isDark ? 'plus-lighter' : 'multiply'};
  ${css}
}`;
  document.getElementById('opencode-theme-preload')?.remove();
  ensureStyleElement().textContent = fullCss;
  document.documentElement.dataset.theme = themeId;
  document.documentElement.dataset.colorScheme = mode;

  document.documentElement.classList.toggle('haze-colors__lightTheme', !isDark);
  document.documentElement.classList.toggle('haze-colors__darkTheme', isDark);
}

export function removeTheme(): void {
  const existing = document.getElementById(THEME_STYLE_ID);
  if (existing) existing.remove();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.classList.remove('haze-colors__lightTheme', 'haze-colors__darkTheme');
}

const themeModules = import.meta.glob<{ default: DesktopTheme }>('./json/*.json');

export function getThemeIds(): string[] {
  return Object.keys(themeModules)
    .map(path => path.slice('./json/'.length, -'.json'.length))
    .sort();
}

export async function loadTheme(id: string): Promise<DesktopTheme | undefined> {
  const loader = themeModules[`./json/${id}.json`];
  if (!loader) return undefined;
  const mod = await loader();
  return mod.default;
}

export const THEME_NAMES: Record<string, string> = {
  'oc-2': 'OC-2',
  'amoled': 'AMOLED',
  'aura': 'Aura',
  'ayu': 'Ayu',
  'carbonfox': 'Carbonfox',
  'catppuccin': 'Catppuccin',
  'catppuccin-frappe': 'Catppuccin Frappe',
  'catppuccin-macchiato': 'Catppuccin Macchiato',
  'cobalt2': 'Cobalt2',
  'cursor': 'Cursor',
  'dracula': 'Dracula',
  'everforest': 'Everforest',
  'flexoki': 'Flexoki',
  'github': 'GitHub',
  'gruvbox': 'Gruvbox',
  'kanagawa': 'Kanagawa',
  'lucent-orng': 'Lucent Orng',
  'material': 'Material',
  'matrix': 'Matrix',
  'mercury': 'Mercury',
  'monokai': 'Monokai',
  'nightowl': 'Night Owl',
  'nord': 'Nord',
  'one-dark': 'One Dark',
  'onedarkpro': 'One Dark Pro',
  'opencode': 'OpenCode',
  'orng': 'Orng',
  'osaka-jade': 'Osaka Jade',
  'palenight': 'Palenight',
  'rosepine': 'Rose Pine',
  'shadesofpurple': 'Shades of Purple',
  'solarized': 'Solarized',
  'synthwave84': 'Synthwave \'84',
  'tokyonight': 'Tokyonight',
  'vercel': 'Vercel',
  'vesper': 'Vesper',
  'zenburn': 'Zenburn',
};
