# TYPE SYSTEM REFERENCE

## OVERVIEW
TypeScript types for opencode-ui covering API contracts, domain models, and shared interfaces.

## WHERE TO LOOK
| Need | File | Notes |
|------|------|-------|
| API request/response types | `api.ts` | 80+ endpoints, 1396 lines, auto-generated |
| Session data structures | `session.ts` | Session, SessionStatus, session metadata |
| Message types | `message.ts` | Message, AssistantMessage, UserMessage, MessageError |
| Message parts (content blocks) | `part.ts` | Part union: Text, Tool, Reasoning, File, StepStart |
| Common primitives | `common.ts` | ID, Timestamp, Pagination, FileDiff, Range, Permission |
| Project types | `project.ts` | Project, Path, VcsInfo, sandbox config |
| Provider/model types | `provider.ts` | Model, Provider, Agent, MCP/LSP/Formatter status |
| Configuration schemas | `config.ts` | Config, LayoutConfig, McpConfig, ProviderConfig |
| Event system | `event.ts` | 30+ event types (SessionCreated, MessageUpdated, etc.) |
| File operations | `file.ts` | FileNode, FileContent, FileChange, FindTextMatch |
| Terminal types | `terminal.ts` | Pty, PtyCreateInput, PtyUpdateInput |
| Theme system | `theme.ts` | ThemeVariant, ColorScheme |
| Commands/todos | `command.ts` | Command, Todo |
| All types | `index.ts` | Barrel export, import from here |

## CONVENTIONS
- Use `type` not `interface` for type definitions
- No `enum` — use union types instead
- Domain types grouped by feature (session, message, part, project)
- `api.ts` is auto-generated from backend schema — do not manually edit
- Shared cross-cutting types live in `common.ts` and `shared-types.ts`
- Import from `index.ts` barrel file to simplify imports
- Union types preferred over enums for string literals
- Optional fields marked with `?` suffix

## NOTES
- `api.ts` is the single source of truth for API contract types
- Events follow `Event<Name>` naming convention
- `shared-types.ts` contains types shared between frontend and backend
- When adding new types, determine if they belong in a feature file or `common.ts`
- Part types represent the granular components of messages (text, tool calls, reasoning)
