# API Full Documentation (`@remcostoeten/use-shortcut`)

This document covers the full current public package API (from `src/index.ts`) and what is possible with each export.

## 1. Core Usage (React)

### `useShortcut(options?)`
Creates a chainable shortcut builder.

```tsx
import { useShortcut } from "@remcostoeten/use-shortcut"

export function Example() {
  const $ = useShortcut({ activeScopes: ["editor"] })

  // single combo
  $.mod.key("s").on((event) => {
    event.preventDefault()
    console.log("save")
  })

  // sequence
  $.key("g").then("d").on(() => {
    console.log("go dashboard")
  })

  // scoped + exceptions
  $.mod.key("k")
    .in("global")
    .except(["input", "modal"])
    .on(() => {
      console.log("open palette")
    })

  return null
}
```

## 2. Chain API: All Possibilities

`useShortcut()` returns `ShortcutBuilder`.

### Builder-level methods/properties
- `$.ctrl`, `$.shift`, `$.alt`, `$.cmd`, `$.mod`
- `$.key(actionKey)`
- `$.in(scopes)`
- `$.setScopes(scopes)`
- `$.enableScope(scope)`
- `$.disableScope(scope)`
- `$.getScopes()`
- `$.isScopeActive(scope)`
- `$.record(options?)`

### After `.key(...)`: `KeyChain`
- `.on(handler, options?)`
- `.handle({ handler, ...options })`
- `.except(condition)`
- `.in(scopes)`
- `.then(nextStep)`

### After `.except(...)`: `KeyChainWithExcept`
- `.on(handler, optionsWithoutExcept?)`
- `.in(scopes)`
- `.then(nextStep)`

### Example covering all chain operations
```tsx
import { useShortcut } from "@remcostoeten/use-shortcut"

export function FullChainExample() {
  const $ = useShortcut({ activeScopes: ["global", "editor"] })

  $.setScopes(["global"])
  $.enableScope("editor")
  $.disableScope("modal")

  const active = $.getScopes()
  const isEditorOn = $.isScopeActive("editor")
  console.log(active, isEditorOn)

  $.ctrl.shift.key("p")
    .in(["global", "editor"])
    .except((event) => (event.target as HTMLElement | null)?.matches?.("[data-readonly='true']") ?? false)
    .then("k")
    .on((event) => {
      event.preventDefault()
      console.log("complex shortcut")
    }, {
      priority: 10,
      stopOnMatch: true,
      sequenceTimeout: 1200,
      description: "Complex chain example",
    })

  $.alt.key("x").handle({
    handler: () => console.log("handled via .handle"),
    delay: 150,
  })

  return null
}
```

## 3. Hook Options (`UseShortcutOptions`)

All available options:
- `debug?: boolean`
- `delay?: number`
- `ignoreInputs?: boolean`
- `target?: HTMLElement | Window | null`
- `eventType?: "keydown" | "keyup"`
- `disabled?: boolean`
- `activeScopes?: ShortcutScope`
- `sequenceTimeout?: number`
- `conflictWarnings?: boolean`
- `onConflict?: (conflict: ShortcutConflict) => void`
- `eventFilter?: (event: KeyboardEvent) => boolean`

```tsx
const $ = useShortcut({
  debug: false,
  delay: 0,
  ignoreInputs: true,
  target: window,
  eventType: "keydown",
  disabled: false,
  activeScopes: ["editor", "global"],
  sequenceTimeout: 900,
  conflictWarnings: true,
  onConflict: (conflict) => console.warn(conflict),
  eventFilter: (event) => !event.repeat,
})
```

## 4. Handler Options (`HandlerOptions`)

All available per-binding options:
- `preventDefault?: boolean`
- `stopPropagation?: boolean`
- `delay?: number`
- `description?: string`
- `disabled?: boolean`
- `except?: ExceptPreset | ExceptPreset[] | ExceptPredicate`
- `scopes?: ShortcutScope`
- `sequenceTimeout?: number`
- `priority?: number`
- `stopOnMatch?: boolean`

```tsx
$.mod.key("s").on(save, {
  preventDefault: true,
  stopPropagation: false,
  delay: 0,
  description: "Save document",
  disabled: false,
  except: ["input", "typing"],
  scopes: ["editor"],
  sequenceTimeout: 1000,
  priority: 5,
  stopOnMatch: true,
})
```

## 5. `ShortcutResult`: All Methods/Fields

Returned by `.on(...)` / `.handle(...)`:
- `unbind()`
- `display: string`
- `combo: string`
- `trigger()`
- `isEnabled: boolean`
- `enable()`
- `disable()`
- `onAttempt?(callback)`

```tsx
const result = $.mod.key("s").on(() => console.log("save"))

console.log(result.display) // e.g. "⌘S"
console.log(result.combo)   // e.g. "cmd+s"

result.disable()
result.enable()
result.trigger()

const unsubscribe = result.onAttempt?.((matched) => {
  console.log("attempt", matched)
})

unsubscribe?.()
result.unbind()
```

## 6. Recording (`ShortcutRecordingOptions`)

`$.record(options?)` supports:
- `target?: HTMLElement | Window | null`
- `eventType?: "keydown" | "keyup"`
- `timeoutMs?: number`

```tsx
const recorded = await $.record({ timeoutMs: 5000 })
console.log("Recorded combo:", recorded)
```

## 7. Parser and Matcher Utilities

### `parseShortcut(shortcut)`
Parses a single combo string into `ParsedShortcut`.

### `parseShortcuts(shortcuts)`
Parses one or multiple combo strings.

### `matchesShortcut(event, parsed)`
Checks one event against one parsed shortcut.

### `matchesAnyShortcut(event, parsedShortcuts)`
Checks one event against many parsed shortcuts.

```tsx
import {
  parseShortcut,
  parseShortcuts,
  matchesShortcut,
  matchesAnyShortcut,
} from "@remcostoeten/use-shortcut"

const parsedSave = parseShortcut("mod+s")
const parsedMany = parseShortcuts(["mod+s", "escape", "g d"])

window.addEventListener("keydown", (event) => {
  if (matchesShortcut(event, parsedSave)) {
    console.log("save hit")
  }

  if (matchesAnyShortcut(event, parsedMany)) {
    console.log("one of tracked shortcuts hit")
  }
})
```

## 8. Formatting and Platform Utilities

### `formatShortcut(shortcut, platform?)`
Formats shortcut strings for display.

### `detectPlatform()`
Returns `"mac" | "windows" | "linux"`.

### `Platform`
Constant bag: `Platform.MAC`, `Platform.WINDOWS`, `Platform.LINUX`.

### `ModifierDisplaySymbols`
Platform-specific modifier labels/symbols.

### `ModifierDisplayOrder`
Platform-specific modifier render order.

### `ModifierAliases`
Token alias map (e.g. `cmd`, `option`, `mod`, etc).

### `SpecialKeyMap`
Key alias map (e.g. `esc` -> `Escape`, `spacebar` -> ` `).

### `ModifierKey`
Canonical keys: `META`, `CTRL`, `ALT`, `SHIFT`.

```tsx
import {
  formatShortcut,
  detectPlatform,
  Platform,
  ModifierDisplaySymbols,
  ModifierDisplayOrder,
} from "@remcostoeten/use-shortcut"

const platform = detectPlatform()
const label = formatShortcut("mod+shift+p", platform)
const symbols = ModifierDisplaySymbols[platform]
const order = ModifierDisplayOrder[platform]

console.log(platform === Platform.MAC ? "mac behavior" : "non-mac behavior")
console.log(label, symbols, order)
```

## 9. Type Exports: What They Enable

### Key-space typing
- `ActionKey`: all valid `.key(...)` inputs
- `AlphaKey`, `NumericKey`, `FunctionKey`, `NavigationKey`, `SpecialKey`, `SymbolKey`: specialized subsets

### Modifier typing
- `ModifierName`: `"ctrl" | "shift" | "alt" | "cmd" | "mod"`
- `ModifierFlags`: `{ ctrl; shift; alt; cmd }` (builder-oriented flags)
- `ModifierState`: `{ meta; ctrl; alt; shift }` (event/parser shape)

### Builder/chain typing
- `ShortcutBuilder`
- `ModifierChain`
- `KeyChain`

### Handler/runtime typing
- `ShortcutHandler`
- `HandlerOptions`
- `UseShortcutOptions`
- `ShortcutResult`
- `ShortcutRecordingOptions`

### Parsing/conflict/scope typing
- `ParsedShortcut`
- `ExceptPreset` (`input | editable | typing | modal | disabled`)
- `ExceptPredicate`
- `ShortcutScope` (`string | string[]`)
- `ShortcutConflict` (`exact | sequence-prefix`)

## 10. Practical Patterns

### A) Simple app (recommended default)
- Use `useShortcut`
- Use `.mod.key(...).on(...)`
- Use `formatShortcut` for UI labels

### B) Editor app
- Use scopes heavily (`in`, `setScopes`, `enableScope`, `disableScope`)
- Use `except` to avoid interfering with inputs/modals
- Use sequence bindings where needed (`then`)

### C) Advanced event-level validation
- Use parser + matcher utilities for custom global listeners/telemetry

## 11. Current Public Surface Checklist

This document targets all currently exported package symbols from `src/index.ts`:
- functions/hooks/utilities/constants and all exported TS types.
- map/group APIs are intentionally removed from public exports on this branch.

