# SESSION COMPONENTS

## OVERVIEW
核心会话/聊天功能组件，包含消息时间线、输入区域、侧边面板、工具调用和文件展示。

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add message part type | `src/types/part.ts` + `session-turn.tsx` | Extend Part union + PartRenderer switch |
| Modify message rendering | `message-timeline.tsx` | Auto-scroll, turn pairing, empty states |
| Change input behavior | `session-composer.tsx` | Textarea auto-resize, Enter/Shift+Enter handling |
| Add side panel tab | `session-side-panel.tsx` | Files/Changes tabs at 320px width |
| Code highlighting | `markdown-renderer.tsx` | Shiki with github-dark theme |
| Tool call display | `message-tool-call.tsx` | Collapsible tool invocations |

## CONVENTIONS
- **Message pairing**: `buildTurnPairs()` groups user messages with their assistant responses
- **Auto-scroll**: Track with `autoScrollRef.current`, set false when user scrolls up, true when near bottom
- **Streaming**: Pass `streaming` prop down for loading states, check `isStreaming` per turn
- **Parts management**: Store parts by message ID in `Map<string, Part[]>`, lookup via `partsByMessage.get(msg.id)`
- **Step grouping**: `groupSteps()` pairs step-start/step-finish parts for nested display
- **Time formatting**: `formatTime(ms)` converts duration to "Xm Ys" format
- **Code blocks**: Shiki highlighter is lazy-loaded on mount, falls back gracefully if import fails
- **Long code collapse**: Code blocks over 15 lines collapse with "Show all N lines" button
- **Line numbers**: Auto-enabled for code blocks with more than 3 lines

## NOTES
- MessageTimeline uses ScrollArea for scroll events, not native scroll
- Composer textarea auto-resizes via `style.height = ${Math.min(scrollHeight, 200)}px`
- Side panel uses FileContext for tree/diff data, FileViewer/DiffViewer for display
- MarkdownRenderer pre-parses blocks to separate code blocks for shiki highlighting
- Tool calls default open for `bash` tool only (see `defaultOpen={part.tool === 'bash'}`)
- Interrupted messages show orange "Interrupted" badge, other errors show red error box
- User messages display agent/model metadata, assistant messages show duration
- Fork/Revert actions passed via `actions` prop on MessageTimeline -> SessionTurn
