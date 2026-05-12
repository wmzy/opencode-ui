import { css } from '@linaria/core';

export const globalStyles = css`
  :global() {
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html,
    body {
      height: 100%;
      overflow: hidden;
      font-family: var(--haze-font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
        'Helvetica Neue', Arial, sans-serif);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background-color: var(--color-bg, #0a0a0a);
      color: var(--color-text, #e5e5e5);
    }

    #root {
      height: 100%;
    }

    :root {
      --color-bg: #0a0a0a;
      --color-bg-secondary: #141414;
      --color-bg-tertiary: #1e1e1e;
      --color-text: #e5e5e5;
      --color-text-secondary: #a3a3a3;
      --color-text-tertiary: #737373;
      --color-border: #262626;
      --color-border-focus: #404040;
      --color-accent: #6366f1;
      --color-accent-hover: #818cf8;
      --color-success: #22c55e;
      --color-warning: #f59e0b;
      --color-error: #ef4444;
      --color-info: #3b82f6;
      --sidebar-width: 280px;
      --sidebar-rail-width: 48px;
      --titlebar-height: 40px;
      --prompt-min-height: 44px;
      --safe-area-top: env(safe-area-inset-top, 0px);
      --safe-area-bottom: env(safe-area-inset-bottom, 0px);
    }

    a {
      color: var(--color-accent);
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    ::-webkit-scrollbar-track {
      background: transparent;
    }

    ::-webkit-scrollbar-thumb {
      background: var(--color-border);
      border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--color-border-focus);
    }

    @media (max-width: 768px) {
      ::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }
    }

    pre,
    code {
      font-family: var(--haze-font-mono, 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace);
    }

    input,
    textarea,
    select {
      font-family: inherit;
    }

    button {
      cursor: pointer;
      border: none;
      background: none;
      font-family: inherit;
    }

    img {
      max-width: 100%;
      height: auto;
    }
  }
`;
