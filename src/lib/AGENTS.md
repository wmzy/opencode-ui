# LIBRARY KNOWLEDGE BASE

## OVERVIEW
Utility functions and SDK client for the opencode-ui project.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add new API service method | `sdk.ts` | Add to OpenCodeSdk interface + implementation, use withDirectory() |
| Subscribe to SSE events | `sse-client.ts` | SSEClient with coalesceFrameMs for merging rapid events |
| Persist UI state | `persist.ts` | createPersistedState(key, defaultValue, migration) |
| Debounce user input | `debounce.ts` | debounce(fn, ms).cancel() for cleanup |
| Format file sizes/costs | `format.ts` | formatFileSize, formatCost helpers |
| Generate IDs | `id.ts` | generateId("ses"|"msg"|"per"|"que"|"pty") |
| Time formatting | `time.ts` | formatRelativeTime, formatDuration, isToday |
| Base64 auth tokens | `base64.ts` | authTokenFromCredentials |

## CONVENTIONS
- All exports are named exports (no defaults)
- SDK methods use withDirectory() to inject ?directory=... query param
- Error handling: ApiError class for API failures, silent catch in persist.ts (// ignore pattern)
- SSE client merges rapid events via coalesceFrameMs (default 30ms)
- persist.ts uses deepMerge with migration support for localStorage versioning
- Debounce/throttle functions include .cancel() methods for cleanup
- Time utilities return strings, not Date objects where possible
- ID generation uses crypto.getRandomValues() for uniqueness

## NOTES
- createSdk() factory accepts optional defaultDirectory. Use getSdk(directory) from SdkContext for per-project scoping
- SDK services: session, file, find, pty, provider, mcp, global, config, lsp, formatter, permission, question, auth, vcs, command, agent, skill, project, path, instance, app
- persist.ts implements reactive state with subscribe(listener) pattern
- SSE client auto-reconnects with exponential backoff (reconnectDelayMs, maxReconnectDelayMs)
- time.ts formatRelativeTime returns "just now" for <60s, or "5m ago", "2h ago", etc.
