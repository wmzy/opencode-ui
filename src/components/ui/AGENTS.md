# UI PRIMITIVES

## OVERVIEW
19 reusable UI primitive components using Linaria CSS-in-JS.

## WHERE TO LOOK
| Task | Component | Notes |
|------|-----------|-------|
| Primary actions | `button.tsx` | Variants: primary, secondary, ghost, danger. Sizes: sm, md, lg. Supports loading, fullWidth |
| Icon-only actions | `icon-button.tsx` | Square button for icons only |
| Text input | `input.tsx` | Basic text field |
| Multi-line input | `textarea.tsx` | Auto-resize enabled |
| Form selection | `select.tsx` | Dropdown select |
| Toggle state | `switch.tsx` | Boolean toggle |
| Navigation | `tabs.tsx` | Tab navigation component |
| Modal dialogs | `dialog.tsx` | Modal wrapper (used in Settings) |
| Dropdown menus | `dropdown-menu.tsx` | Menu with items (used in command palette) |
| Tooltips | `tooltip.tsx` | Hover tooltip with position options |
| Toast notifications | `toast.tsx` | Via sonner library |
| Loading states | `spinner.tsx`, `skeleton.tsx` | Spinner for async ops, skeleton for content placeholders (variants: text, circle, rectangle) |
| Status display | `badge.tsx` | Status/type badges |
| Typography | `text.tsx` | Text component for consistent styling |
| Content container | `card.tsx` | Card wrapper |
| Collapsible sections | `collapsible.tsx` | Animated expand/collapse |
| Custom scrollbars | `scroll-area.tsx` | autoHideScrollbar option available |
| Resizable panels | `resize-handle.tsx` | Drag-to-resize handle |

## CONVENTIONS
- **Styling**: Linaria `css` tagged template + `cx` for conditional classes. NO Tailwind.
- **Exports**: Named exports only, no default exports. `export function Button() {}`
- **Variants**: Use `type` props for variants (e.g., `variant="primary"`, `size="md"`)
- **Composition**: Primitives are building blocks, compose them into feature components in parent directories
- **Icons**: Pass icon components as children, no built-in icon system
- **No barrel file**: Import directly from each file: `import { Button } from '@/components/ui/button'`

## NOTES
- All components use Linaria for zero-runtime CSS-in-JS via @wyw-in-js
- Toast notifications use the `sonner` library, not a custom implementation
- Resize-handle is used in resizable panels (sidebar, terminal, etc.)
- ScrollArea provides consistent cross-platform scrollbars
- Skeleton has three shape variants for different content patterns
