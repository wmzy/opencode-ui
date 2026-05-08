# THEME SYSTEM KNOWLEDGE BASE

## OVERVIEW
Theme resolution engine that converts JSON theme definitions into 300+ CSS custom properties with Oklch color space conversions.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add new theme | `src/themes/json/*.json` | JSON with light/dark variants, palette colors, and optional overrides |
| Modify color generation | `src/themes/color.ts` | Color space conversion (hexToOklch), scale generation (generateScale), blending |
| Adjust CSS var mapping | `src/themes/resolve.ts` | Maps palette to 300+ CSS vars (--color-*) for surfaces, text, borders, icons |
| Preview/apply themes | `src/themes/loader.ts` | applyTheme() injects CSS, loadTheme() imports JSON modules via Vite glob |
| Theme UI selector | `src/components/settings/` | Theme picker dialog connects to ThemeContext (see context/AGENTS.md) |

## CONVENTIONS
- **Theme JSON**: Must have `id`, `name`, `light`/`dark` variants with `palette` (compact) or `seeds` (seed-based). `overrides` for custom CSS vars.
- **Color space**: All conversions use Oklch for perceptually uniform scales. Never manipulate RGB directly.
- **CSS vars**: Generated vars follow `--category-strength` pattern: `background-base`, `text-weak`, `surface-raised-strong-hover`.
- **Overrides**: Theme JSON `overrides` object replaces any generated token. Use sparingly.
- **Compact vs seeds**: `palette` = pre-computed 12-step scales (compact mode). `seeds` = algorithmically generated from base colors.

## NOTES
- 37 theme files in `json/` cover popular editor themes (Dracula, Tokyo Night, Catppuccin, One Dark Pro, etc.).
- `resolve.ts` (534 lines) is the core resolution pipeline. It generates 300+ tokens per variant.
- `loader.ts` uses Vite's `import.meta.glob('./json/*.json')` for dynamic imports. No runtime JSON parsing.
- Theme switching is instant via `<style id="opencode-theme">` injection. No page reload.
- Dark mode uses CSS `color-scheme: dark` + `--text-mix-blend-mode: plus-lighter` for automatic OS integration.
