# PROJECT KNOWLEDGE BASE

## OVERVIEW
React 19 web frontend for opencode, replicating the SolidJS original with improved mobile support and PWA. Stack: Vite 8, Linaria 7 (CSS-in-JS via @wyw-in-js), TanStack React Query 5, react-router-dom 7. Proxies all API calls to opencode backend at `localhost:4099`.

## STRUCTURE
```
src/
├── components/       # UI components by feature domain
│   ├── ui/           # Primitives: Button, Dialog, ScrollArea, etc.
│   ├── session/      # Chat session: message timeline, composer, side panel
│   ├── layout/       # Shell: sidebar rail, sidebar panel, mobile nav, titlebar
│   ├── settings/     # Settings dialog (General, Shortcuts, Providers, Models tabs)
│   ├── file/         # File tree viewer, diff viewer, file content
│   ├── terminal/     # Terminal panel (WebSocket PTY)
│   ├── dialog/       # Reusable dialog wrappers
│   ├── command-palette/ # Ctrl+Shift+P command palette
│   ├── icons/        # (empty)
│   ├── prompt/       # (empty)
│   └── share/        # (empty)
├── context/          # 14 React context providers (see context/AGENTS.md)
├── types/            # TypeScript types (see types/AGENTS.md)
├── lib/              # Utilities (see lib/AGENTS.md)
├── themes/           # Theme system (see themes/AGENTS.md)
├── pages/            # Route pages: home, layout, session, not-found, error
├── hooks/            # useIsMobile, useMediaQuery, usePersistedState, useKeyboard, useAutoScroll, useResizeObserver, useInstallPrompt
├── i18n/             # en.ts, zh.ts translation files
├── styles/           # Global CSS variables (--color-*)
└── App.tsx           # Root: 14 nested providers → BrowserRouter → Routes
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add new API endpoint | `src/lib/sdk.ts` | Add method to OpenCodeSdk interface + implementation |
| Add new page/route | `src/App.tsx` + `src/pages/` | Routes defined in App.tsx under `/:dir` |
| Add new context | `src/context/` + `App.tsx` | Must nest in correct provider order |
| Add UI primitive | `src/components/ui/` | Use Linaria `css`/`cx`, no Tailwind |
| Add session feature | `src/components/session/` | SessionPage at `src/pages/session.tsx` |
| Add settings tab | `src/components/settings/` | 4-tab dialog, connects to real API |
| Theme changes | `src/themes/` | JSON themes + resolve.ts token resolver |
| Mobile layout | `src/components/layout/` | useIsMobile hook, MobileNav bottom sheet |

## CONVENTIONS
- **Components**: `export function` named exports, no default exports
- **Types**: `type` not `interface`, no `enum`
- **Styling**: Linaria `css` tagged template + `cx` for conditionals. NO Tailwind.
- **Imports**: Path alias `@/*` → `./src/*`
- **State**: React context (no Redux/Zustand). Persisted state via localStorage.
- **API**: SDK client at `src/lib/sdk.ts` with `withDirectory()` for per-project scoping
- **Sessions**: Fetched per-project via `GET /session?directory=...&roots=true&limit=55`
- **Error catch**: Use `// ignore` comment in catch blocks (for stealth-mode localStorage)
- **Package manager**: pnpm
- **Format**: 2-space indent, single quotes, semicolons, trailing commas

## ANTI-PATTERNS
- NO `as any`, `@ts-ignore`, `@ts-expect-error`
- NO `enum` — use union types
- NO Tailwind — Linaria only
- NO default exports on components
- NO `console.log` — use `console.warn`/`console.error` if needed (ESLint warns on console.log)

## COMMANDS
```bash
pnpm dev          # Dev server on :3000, proxies to :4099
pnpm build        # Vite production build + PWA service worker
pnpm typecheck    # tsc --noEmit
pnpm lint         # ESLint
pnpm test         # Vitest (no tests written yet)
```

## NOTES
- PWA manifest is hand-maintained at `public/manifest.json` (vite-plugin-pwa has `manifest: false`)
- Dev server proxies 15 API paths to `localhost:4099` (the opencode Go backend)
- Vite uses `@wyw-in-js/vite` plugin for Linaria compile-time transforms
- `types/api.ts` is 1396 lines of generated API types — do not manually restructure without regenerating
- No tests exist yet despite vitest + testing-library being configured
- `src/components/icons/`, `prompt/`, `share/` are empty scaffolding directories
