# CONTEXT PROVIDERS

## OVERVIEW
15 React context providers forming the core state management layer for opencode-ui.

## WHERE TO LOOK
| Task | Provider | Notes |
|------|----------|-------|
| API client with per-project scoping | `sdk.tsx` | `useSdk()` hook, `getSdk(directory)` factory |
| Real-time SSE sync (sessions/messages/parts) | `global-sync.tsx` | `useSessions()`, `useMessages()`, `useParts()`, `usePermissions()`, `useTodos()`, `useSessionDiffs()` |
| Session CRUD operations | `sync.tsx` | REST + SSE: `sessions`, `allSessions`, `createSession`, `deleteSession` |
| UI layout state persistence | `layout.tsx` | `sidebarOpen`, `sidebarWidth`, `sidePanelOpen`, `terminalOpen`, `activeSessionId` |
| Server connection status | `server.tsx` | `status` (connecting/connected/disconnected), `health()`, `auth` |
| Theme switching | `theme.tsx` | `themeId`, `colorScheme`, preview/commit cycle |
| File tree and content | `file.tsx` | File tree viewer, git status, content loading |
| Terminal PTY sessions | `terminal.tsx` | WebSocket-based terminal emulation |
| Command palette registration | `command.tsx` | `registerCommand()`, `executeCommand()` |
| User preferences | `settings.tsx` | Theme, language, sounds, fonts (persisted) |
| Internationalization | `language.tsx` | `locale`, `t()` translation function |
| Prompt/input state | `prompt.tsx` | `parts`, `model`, `agent`, streaming state |
| Platform detection | `platform.tsx` | Detects Electron vs web |
| React Query client | `query.tsx` | TanStack React Query 5 provider |

## PROVIDER ORDER (outermost → innermost)
```
PlatformProvider
└─ ThemeProvider
   └─ ServerProvider
      └─ QueryProvider
         └─ SDKProvider
            ├─ FileProvider
            ├─ TerminalProvider
            └─ SyncProvider
      └─ GlobalSyncProvider
   └─ SettingsProvider
      └─ LayoutProvider
         └─ I18nProvider
            └─ CommandProvider
               └─ PromptProvider
```

## DEPENDENCY GRAPH
```
ServerProvider → SDKProvider → {FileProvider, TerminalProvider, SyncProvider}
ServerProvider → GlobalSyncProvider
```

## NOTES
- All UI state in LayoutProvider persists to localStorage via usePersistedState
- SDKProvider requires baseUrl from ServerProvider before initialization
- GlobalSyncProvider uses SSE for real-time updates, SyncProvider uses REST + SSE for CRUD
- ThemeProvider uses JSON themes in `src/themes/` with preview/commit pattern for testing
- PlatformProvider enables Electron-specific features (native windows, tray icon)
