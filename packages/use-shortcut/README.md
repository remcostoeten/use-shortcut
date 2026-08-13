# @remcostoeten/use-shortcut

Tiny, chainable keyboard shortcuts for React and Next.js.

The package keeps the fluent `useShortcut()` API, but it is now documented as explicit entrypoints so consumers can choose the narrowest surface that fits their use case.

## Entrypoints

- `@remcostoeten/use-shortcut`
  Full compatibility barrel.
- `@remcostoeten/use-shortcut/react`
  Recommended React entrypoint.
- `@remcostoeten/use-shortcut/parser`
  Parser and matcher utilities.
- `@remcostoeten/use-shortcut/formatter`
  Display formatting utilities such as `formatShortcut()` and `getModifierSymbols()`.
- `@remcostoeten/use-shortcut/constants`
  Platform and normalization constants.

This package is for React and Next.js apps. If you are building on that stack, prefer `@remcostoeten/use-shortcut/react`.

## Size

Measured in this package on August 13, 2026 (v2.5):

- root published ESM build: about `24 kB` minified
- React entrypoint (`/react`): about `23.7 kB` minified, `8.2 kB` gzip
- parser-only entrypoint: about `2.9 kB` minified

The runtime is small in practice, and every hook instance on the same target now shares one DOM keydown listener instead of attaching its own. The entrypoint split prevents accidental convenience-barrel imports and makes the architecture explicit.

## React API

The public runtime API is React-only. Parser, formatter, and constants exports are supporting utilities inside the same React/Next.js package, not a separate framework-agnostic runtime.
For one-off shortcuts, prefer `useShortcutBinding()` so React owns registration and cleanup. Use the fluent `useShortcut()` builder when you need advanced chaining, recording, debug streams, or imperative scope control.

```tsx
import { useShortcutBinding } from "@remcostoeten/use-shortcut/react"

function App() {
  useShortcutBinding("mod+k", openPalette, { preventDefault: true })
  useShortcutBinding("mod+p", openProjects)
  useShortcutBinding("escape", closePalette)

  return <div>Press Cmd/Ctrl+K</div>
}
```

Main React exports:

- `useShortcut(options?)`
- `useShortcutBinding(keys, handler, options?, shortcutOptions?)`
- `useShortcutMap(shortcutMap, options?)`
- `registerShortcutMap(builder, shortcutMap)`
- `createShortcutGroup()`
- `useShortcutGroup()`

## Key Semantics

- `"mod+s"` — one combo
- `"g then d"` — one multi-step sequence
- `["escape", "mod+d"]` — alternatives; any one of them fires the handler
- `["mod+k", "g then k"]` — alternatives may themselves be sequences

## Bound Combo Example

Use `.bind()` when your shortcuts already exist as strings in config or user
settings.

```tsx
import { useShortcutBinding } from "@remcostoeten/use-shortcut/react"

const appShortcuts = {
  openCommandPalette: {
    combo: "mod+k",
    description: "Open command palette",
  },
  closeDialog: {
    combo: ["escape", "mod+d"],
    description: "Close dialog",
  },
}

function App() {
  useShortcutBinding(
    appShortcuts.openCommandPalette.combo,
    openPalette,
    {
      description: appShortcuts.openCommandPalette.description,
      preventDefault: true,
    },
  )

  useShortcutBinding({
    keys: appShortcuts.closeDialog.combo,
    handler: closeDialog,
    options: {
      description: appShortcuts.closeDialog.description,
    },
  })

  return <div>Shortcuts ready</div>
}
```

## Features

- Chainable shortcut builder: `$.mod.key("k").on(handler)`
- Declarative single bindings: `useShortcutBinding("mod+k", handler)`
- Pre-bound combos with `$.bind("mod+k").on(handler)`
- Bulk shortcut maps: `useShortcutMap()` and `registerShortcutMap()`
- Modifier support: `ctrl`, `shift`, `alt`, `cmd`, `mod`
- Sequence support: `$.key("g").then("d")`
- Scope-aware shortcuts with `.in(...)`, `setScopes`, `enableScope`, `disableScope`
- Exception predicates and presets with `.except(...)`
- Recording mode with `$.record({ timeoutMs, signal })` (abortable, auto-cancelled on unmount)
- Structured debug stream with `$.onDebug(...)`
- Per-shortcut attempt inspection with `result.onAttempt(...)`
- Conflict detection for exact and sequence-prefix overlaps, including across hook instances on the same target
- One shared DOM listener per `(target, eventType)` across all hook instances
- Shifted-symbol matching: `shift+2` also matches the `@` the browser reports
- Priority ordering and `stopOnMatch`
- Global guard/filter support via `eventFilter`

## Shortcut Map Example

```tsx
import { useMemo } from "react"
import { useShortcutMap } from "@remcostoeten/use-shortcut/react"

function App() {
  const shortcuts = useMemo(
    () => ({
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
    }),
    [openPalette, closePalette, toggleSidebar],
  )

  useShortcutMap(
    shortcuts,
    { ignoreInputs: false },
  )

  return <div>Shortcuts ready</div>
}
```

## Debug Example

```tsx
import { useEffect } from "react"
import { useShortcut } from "@remcostoeten/use-shortcut/react"

function DebugProbe() {
  const $ = useShortcut({
    debug: {
      console: true,
      includeCode: true,
      includeLocation: true,
      includeKeyCode: true,
    },
  })

  useEffect(() => {
    const removeDebug = $.onDebug((event) => {
      console.log("key", event.input.combo, event.attempts)
    })

    const result = $.shift.key("e").then("e").on(runProbe, {
      description: "sequence probe",
    })

    const removeAttempt = result.onAttempt?.((matched, _event, details) => {
      console.log(matched ? "matched" : details?.status, details?.steps)
    })

    return () => {
      removeDebug()
      removeAttempt?.()
      result.unbind()
    }
  }, [$, runProbe])

  return null
}
```

## Architecture

- `src/builder.ts`
  Chainable builder runtime and registration plumbing.
- `src/runtime/*`
  Listener attachment, matching, conflicts, guards, recording, and debug internals.
- `src/hook.ts`
  React integration and bulk registration helpers.
- `src/react.ts`
  Narrow React entrypoint for hook consumers.
- `src/parser.ts`, `src/formatter.ts`, `src/constants.ts`
  Standalone utility entrypoints.
- `src/index.ts`
  Full compatibility barrel.

The API design keeps the fluent React path front-and-center while still exposing low-level parser and formatter utilities when needed.

## Development

```bash
bun run typecheck
bun run test
bun run build
```

## License

MIT
