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

Measured in this package on March 12, 2026:

- root published ESM build: about `16.5 kB` minified
- app bundle for `useShortcut` only: about `13.8 kB` minified
- gzip for the React hook path: about `5.3 kB`

That means the runtime is already small in practice. The entrypoint split mainly prevents accidental convenience-barrel imports and makes the architecture explicit.

## React API

The public runtime API is React-only. Parser, formatter, and constants exports are supporting utilities inside the same React/Next.js package, not a separate framework-agnostic runtime.

```tsx
import { useShortcut } from "@remcostoeten/use-shortcut/react"

function App() {
  const $ = useShortcut()

  $.mod.key("k").on(() => openPalette(), { preventDefault: true })
  $.bind("mod+p").on(() => openProjects())
  $.key("escape").on(() => closePalette())

  return <div>Press Cmd/Ctrl+K</div>
}
```

Main React exports:

- `useShortcut(options?)`
- `useShortcutMap(shortcutMap, options?)`
- `registerShortcutMap(builder, shortcutMap)`
- `createShortcutGroup()`
- `useShortcutGroup()`

## Bound combo example

Use `.bind()` when your shortcuts already exist as strings in config or user
settings.

```tsx
import { useShortcut } from "@remcostoeten/use-shortcut/react"

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
  const $ = useShortcut()

  $.bind(appShortcuts.openCommandPalette.combo).on(() => {
    openPalette()
  }, {
    description: appShortcuts.openCommandPalette.description,
    preventDefault: true,
  })

  $.bind(appShortcuts.closeDialog.combo).on(() => {
    closeDialog()
  }, {
    description: appShortcuts.closeDialog.description,
  })

  return <div>Shortcuts ready</div>
}
```

## Features

- Chainable shortcut builder: `$.mod.key("k").on(handler)`
- Pre-bound combos with `$.bind("mod+k").on(handler)`
- Bulk shortcut maps: `useShortcutMap()` and `registerShortcutMap()`
- Modifier support: `ctrl`, `shift`, `alt`, `cmd`, `mod`
- Sequence support: `$.key("g").then("d")`
- Scope-aware shortcuts with `.in(...)`, `setScopes`, `enableScope`, `disableScope`
- Exception predicates and presets with `.except(...)`
- Recording mode with `$.record({ timeoutMs })`
- Structured debug stream with `$.onDebug(...)`
- Per-shortcut attempt inspection with `result.onAttempt(...)`
- Conflict detection for exact and sequence-prefix overlaps
- Priority ordering and `stopOnMatch`
- Global guard/filter support via `eventFilter`

## Shortcut Map Example

```tsx
import { useShortcutMap } from "@remcostoeten/use-shortcut/react"

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

## Debug Example

```tsx
import { useShortcut } from "@remcostoeten/use-shortcut/react"

const $ = useShortcut({
  debug: {
    console: true,
    includeCode: true,
    includeLocation: true,
    includeKeyCode: true,
  },
})

const removeDebug = $.onDebug((event) => {
  console.log("key", event.input.combo, event.attempts)
})

const result = $.shift.key("e").then("e").on(runProbe, {
  description: "sequence probe",
})

const removeAttempt = result.onAttempt?.((matched, _event, details) => {
  console.log(matched ? "matched" : details?.status, details?.steps)
})
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
