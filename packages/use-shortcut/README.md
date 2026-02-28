# @remcostoeten/use-shortcut

[![npm version](https://img.shields.io/npm/v/@remcostoeten/use-shortcut.svg)](https://www.npmjs.com/package/@remcostoeten/use-shortcut)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

Chainable keyboard shortcuts for React with **perfect TypeScript intellisense**.

[**View Live Demo & Playground**](https://use-shortcuts.vercel.app)

```tsx
const $ = useShortcut()

// Chainable, typesafe, platform-aware
$.cmd.shift.key("s").on(() => save())
$.mod.key("k").on(() => search())
$.key("/").except("typing").on(() => focusSearch())
```

## Features

- **Chainable API** - Fluent, readable shortcut definitions
- **Sequences/chords** - Multi-step bindings like `$.key("g").then("d")`
- **Named scopes** - Activate/deactivate shortcut contexts (`editor`, `navigation`, etc.)
- **Conflict detection** - Detect exact and sequence-prefix overlaps
- **Shortcut maps** - Register many shortcuts at once with `useShortcutMap()`
- **Recording mode** - Capture the next key combo for custom keybind UIs
- **Perfect TypeScript** - Intellisense at every step
- **Cross-platform** - `mod` = ⌘ on Mac, Ctrl on Windows/Linux
- **Context-aware** - Skip shortcuts in inputs with `.except()`
- **Zero dependencies** - Only React as peer dependency
- **Tiny** - ~3KB gzipped

## Installation

### npm/pnpm/bun

```bash
npm install @remcostoeten/use-shortcut
pnpm add @remcostoeten/use-shortcut
bun add @remcostoeten/use-shortcut
```

### Copy-paste (shadcn-style)

```bash
npx @remcostoeten/use-shortcut init
# or
bunx @remcostoeten/use-shortcut init
```

This copies the source files directly into your project at `hooks/use-shortcut/`.

### App Architecture Scaffold (React/Next)

Generate a scalable, reusable shortcut architecture with typed registry, scopes, provider state/actions, and persistent user bindings:

```bash
# Next.js-oriented scaffold (default)
npx @remcostoeten/use-shortcut scaffold

# React scaffold
npx @remcostoeten/use-shortcut scaffold --framework react

# Custom location
npx @remcostoeten/use-shortcut scaffold --target src --dir shortcuts
```

Generated structure:

```txt
src/shortcuts/
  index.ts
  provider.tsx
  registry.ts
  runtime.ts
  scopes.ts
  storage.ts
  types.ts
  README.md
```

Architecture docs:
- Human guide: [`docs/app-architecture.md`](./docs/app-architecture.md)
- LLM guide: [`docs/app-architecture.llm.md`](./docs/app-architecture.llm.md)

## Quick Start

```tsx
"use client"

import { useShortcut } from "@remcostoeten/use-shortcut"

export function App() {
  const $ = useShortcut()

  $.cmd.key("s").on(() => {
    console.log("Save!")
  })

  $.mod.key("k").on(() => {
    console.log("Search!")
  })

  return <div>Press ⌘+S or ⌘+K</div>
}
```

## API

### Modifiers

Chain modifiers before calling `.key()`:

```tsx
$.ctrl.key("s")           // Ctrl+S
$.shift.key("enter")      // Shift+Enter
$.alt.key("n")            // Alt+N
$.cmd.key("k")            // ⌘+K (Mac) or Ctrl+K (Windows)
$.mod.key("k")            // Cross-platform: ⌘ on Mac, Ctrl on Windows/Linux

// Multiple modifiers
$.ctrl.shift.key("p")     // Ctrl+Shift+P
$.cmd.shift.alt.key("a")  // ⌘+Shift+Alt+A
```

### Keys

Supports all standard keys:

```tsx
// Letters
$.mod.key("s")            // a-z

// Numbers
$.mod.key("1")            // 0-9

// Function keys
$.key("f1")               // f1-f12

// Special keys
$.key("escape")           // escape, enter, space, tab
$.key("backspace")        // backspace, delete
$.mod.key("up")           // up, down, left, right
$.key("home")             // home, end, pageup, pagedown

// Symbols
$.mod.key("slash")        // slash, backslash, comma, period
$.mod.key("/")            // Also works with actual symbol
```

### Exception Handling

Skip shortcuts in certain contexts:

```tsx
// Built-in presets
$.key("/").except("input").on(handler)     // Skip in <input>, <textarea>, <select>
$.key("/").except("editable").on(handler)  // Skip in contenteditable
$.key("/").except("typing").on(handler)    // Skip in any text input
$.key("escape").except("modal").on(handler) // Skip when modal is open
$.key("enter").except("disabled").on(handler) // Skip on disabled elements

// Multiple presets
$.key("/").except(["input", "modal"]).on(handler)

// Custom predicate
$.key("k").except((e) => {
  return e.target.classList.contains("no-shortcuts")
}).on(handler)
```

### Handler Options

```tsx
$.mod.key("s").on(save, {
  preventDefault: true,    // Prevent browser default (default: true)
  stopPropagation: false,  // Stop event bubbling (default: false)
  delay: 100,              // Delay before firing (ms)
  description: "Save doc", // For accessibility
  disabled: false,         // Temporarily disable
})
```

### Result Object

`.on()` returns a result object:

```tsx
const save = $.mod.key("s").on(handleSave)

save.display    // "⌘S" on Mac, "Ctrl+S" on Windows
save.combo      // "cmd+s"
save.isEnabled  // true/false
save.enable()   // Enable the shortcut
save.disable()  // Disable the shortcut
save.unbind()   // Remove the shortcut
save.trigger()  // Programmatically trigger
```

### Sequences / Chords

```tsx
// GitHub-style: press g, then d
$.key("g").then("d").on(() => goToDashboard())

// Steps can include modifiers too
$.key("g").then("shift+d").on(() => openDebug())
```

### Named Scopes

```tsx
const $ = useShortcut({ activeScopes: "navigation" })

$.in("navigation").key("g").then("d").on(() => goToDashboard())
$.in("editor").mod.key("s").on(() => saveFile())

$.setScopes("editor")        // enable editor scope only
$.enableScope("navigation")  // add a second active scope
$.disableScope("editor")     // remove one scope
$.getScopes()                // ["navigation"]
```

### Shortcut Maps

```tsx
import { useShortcutMap } from "@remcostoeten/use-shortcut"

useShortcutMap({
  save: { keys: "mod+s", handler: () => save() },
  undo: { keys: "mod+z", handler: () => undo() },
  dashboard: { keys: ["g", "d"], handler: () => goToDashboard() },
})
```

### Recording Mode

```tsx
const combo = await $.record({ timeoutMs: 5000 })
// e.g. "ctrl+k" or "cmd+k"
```

### Hook Options

```tsx
const $ = useShortcut({
  debug: true,           // Log all shortcuts to console
  delay: 0,              // Global delay for all shortcuts
  ignoreInputs: true,    // Ignore in form elements (default: true)
  disabled: false,       // Disable all shortcuts
  eventType: "keydown",  // or "keyup"
  target: window,        // Custom event target
  activeScopes: "editor", // Active named scopes
  sequenceTimeout: 800,   // ms to complete sequence
  conflictWarnings: true, // Warn on overlaps
  onConflict: (conflict) => {
    console.warn(conflict)
  },
})
```

## Vanilla JS (Non-React)

```tsx
import { createShortcut } from "@remcostoeten/use-shortcut"

const $ = createShortcut()

const save = $.mod.key("s").on(() => {
  console.log("Saved!")
})

// Clean up when done
save.unbind()
```

## Display Formatting

```tsx
import { formatShortcut } from "@remcostoeten/use-shortcut"

formatShortcut("cmd+s")        // "⌘S" on Mac, "Ctrl+S" on Windows
formatShortcut("ctrl+shift+p") // "⌃⇧P" on Mac, "Ctrl+Shift+P" on Windows
```

## TypeScript

Full type definitions with intellisense:

```tsx
import type {
  ShortcutBuilder,
  ShortcutResult,
  ShortcutHandler,
  HandlerOptions,
  ActionKey,
  ModifierName,
} from "@remcostoeten/use-shortcut"
```

## License

MIT © Remco Stoeten
