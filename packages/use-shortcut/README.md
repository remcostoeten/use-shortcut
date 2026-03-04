# @remcostoeten/use-shortcut

WIP keyboard shortcut library for React with a chainable API.

## Status

- Focus right now: runtime architecture and DX refinement
- Documentation scope: feature/status overview only (full API docs will be expanded later)

## Implemented Features

- Chainable shortcut builder: `$.mod.key("k").on(handler)`
- Modifier support: `ctrl`, `shift`, `alt`, `cmd`, `mod`
- Sequence support: `$.key("g").then("d")`
- Scope-aware shortcuts:
  - Register with `.in("editor")`
  - Runtime controls: `setScopes`, `enableScope`, `disableScope`, `getScopes`, `isScopeActive`
- Exception predicates/presets with `.except(...)`
- Shortcut maps:
  - `registerShortcutMap` (imperative)
  - `useShortcutMap` (React lifecycle-aware)
  - Prefer a stable `shortcutMap` reference in React (`useMemo`) for best performance
- Recording mode: `$.record({ timeoutMs })`
- Conflict detection (`exact`, `sequence-prefix`)
- Priority ordering and `stopOnMatch`
- Shortcut grouping helpers:
  - `createShortcutGroup`
  - `useShortcutGroup`
- Global guard/filter support via `eventFilter`
- React entry point:
  - `useShortcut`

## API Intention (Consumer-Facing)

- `useShortcut(options?)`
  - Main React hook. Use this for the chainable API (`$.mod.key("s").on(...)`).
- `useShortcutMap(shortcutMap, options?)`
  - React-first bulk registration. Automatically registers and cleans up with component lifecycle.
- `registerShortcutMap($, shortcutMap)`
  - Imperative bulk registration helper. Use when you already have a builder from `useShortcut` and want manual control.
- `createShortcutGroup()` / `useShortcutGroup()`
  - Group multiple `ShortcutResult` objects and unbind them together.

Internal helpers follow underscore naming (for example `_createShortcutBuilder`, `_canonicalizeParsed`) and are not re-exported from `src/index.ts`.

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
