# @remcostoeten/use-shortcut

WIP keyboard shortcut library for React with a chainable API.

## Status

- Focus right now: runtime architecture and DX refinement
- Documentation scope: feature/status overview only (full API docs will be expanded later)

## Implemented Features

- Chainable shortcut builder: `$.mod.key("k").on(handler)`
- Bulk shortcut maps: `useShortcutMap()` and `registerShortcutMap()`
- Modifier support: `ctrl`, `shift`, `alt`, `cmd`, `mod`
- Sequence support: `$.key("g").then("d")`
- Scope-aware shortcuts:
  - Register with `.in("editor")`
  - Runtime controls: `setScopes`, `enableScope`, `disableScope`, `getScopes`, `isScopeActive`
- Exception predicates/presets with `.except(...)`
- Recording mode: `$.record({ timeoutMs })`
- Conflict detection (`exact`, `sequence-prefix`)
- Priority ordering and `stopOnMatch`
- Global guard/filter support via `eventFilter`
- React entry point:
  - `useShortcut`
  - `useShortcutMap`
  - `useShortcutGroup`

## API Intention (Consumer-Facing)

- `useShortcut(options?)`
  - Main React hook. Use this for the chainable API (`$.mod.key("s").on(...)`).
- `useShortcutMap(shortcutMap, options?)`
  - React-safe bulk registration for render paths where a declarative object is cleaner than multiple `.on()` calls.
- `registerShortcutMap(builder, shortcutMap)`
  - Imperative bulk registration helper when you already have a `useShortcut()` builder.

Internal helpers follow underscore naming (for example `_createShortcutBuilder`, `_canonicalizeParsed`) and are not re-exported from `src/index.ts`.

## Shortcut Map Example

```tsx
import { useShortcutMap } from "@remcostoeten/use-shortcut"

function App() {
  useShortcutMap(
    {
      openPalette: {
        keys: "mod+k",
        handler: () => openPalette(),
        options: { preventDefault: true },
      },
      closePalette: {
        keys: "escape",
        handler: () => closePalette(),
      },
      toggleSidebar: {
        keys: "g then s",
        handler: () => toggleSidebar(),
      },
    },
    { ignoreInputs: false },
  )

  return <div>Shortcuts ready</div>
}
```

If you already have a builder from `useShortcut()`, you can bulk register with `registerShortcutMap($, shortcutMap)` and unbind the returned handles on cleanup.

## Architecture Notes

- Core runtime lives in `src/builder.ts`
- Parsing/formatting are isolated in `src/parser.ts` and `src/formatter.ts`
- React bindings and map helpers live in `src/hook.ts`
- Type contracts live in `src/types.ts`
- CLI scaffold/copy commands live under `cli/`

## Development

```bash
bun run typecheck
bun run test
bun run build
```

## License

MIT
