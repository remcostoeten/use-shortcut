# API Reference (Generated)

Generated from public exports in `src/index.ts`.

## ActionKey

- Kind: `type`
- Source: `src/types.ts:33:1`

All valid action keys that can be used with `.key()`

Examples:
```ts
$.mod.key("s") // "s" is an ActionKey
```

## AlphaKey

- Kind: `type`
- Source: `src/types.ts:2:1`

Lowercase letter keys a-z

## createShortcutGroup

- Kind: `function`
- Source: `src/hook.ts:286:1`
- Signature: `(): ShortcutGroup`

Creates an imperative group controller for many shortcut registrations.

Returns: A `ShortcutGroup` that can add and unbind multiple shortcuts together

Examples:
```ts
```ts
const group = createShortcutGroup()
group.add($.mod.key("s").on(onSave))
group.add($.key("escape").on(onClose))
group.unbindAll()
```
```

## detectPlatform

- Kind: `function`
- Source: `src/constants.ts:19:1`
- Signature: `(): PlatformType`

Detect the current OS platform for modifier normalization and display formatting.
Result is memoized for the page lifecycle.

## ExceptPredicate

- Kind: `type`
- Source: `src/types.ts:74:1`

Custom predicate for excluding shortcuts in certain conditions

Parameters:
- `event`: - The keyboard event to evaluate

Returns: `true` to skip the shortcut, `false` to allow it

## ExceptPreset

- Kind: `type`
- Source: `src/types.ts:84:1`

Built-in exception presets for common scenarios
- "input" - Skip when focused on input, textarea, or select
- "editable" - Skip when focused on contentEditable elements
- "typing" - Skip in any text input context (combines input + editable)
- "modal" - Skip when a modal/dialog is open (checks [data-modal] or [role="dialog"])
- "disabled" - Skip when focused element is disabled

## formatShortcut

- Kind: `function`
- Source: `src/formatter.ts:55:1`
- Signature: `(shortcut: string, platform?: PlatformType): string`

Format a shortcut string for display with platform-aware symbols

Parameters:
- `shortcut`: - Shortcut string (e.g., "cmd+s")
- `platform`: - Optional platform override (default: auto-detect)

Returns: Formatted display string (e.g., "⌘S" on Mac, "Ctrl+S" on Windows)

Examples:
```ts
```ts
formatShortcut("cmd+s") // "⌘S" on Mac, "Ctrl+S" on Windows
formatShortcut("ctrl+shift+p", "mac") // "⌃⇧P"
```
```

## FunctionKey

- Kind: `type`
- Source: `src/types.ts:10:1`

Function keys F1-F12

## HandlerOptions

- Kind: `type`
- Source: `src/types.ts:166:1`

Options for shortcut handler registration

## KeyChain

- Kind: `type`
- Source: `src/types.ts:229:1`

Chain state after calling `.key()` - ready to attach a handler

## matchesAnyShortcut

- Kind: `function`
- Source: `src/parser.ts:120:1`
- Signature: `(event: KeyboardEvent, parsedShortcuts: ParsedShortcut[]): boolean`

Check if a keyboard event matches any of the parsed shortcuts

Parameters:
- `event`: - The keyboard event to check
- `parsedShortcuts`: - Array of parsed shortcuts to match against

Returns: `true` if the event matches any shortcut

## matchesShortcut

- Kind: `function`
- Source: `src/parser.ts:98:1`
- Signature: `(event: KeyboardEvent, parsed: ParsedShortcut): boolean`

Check if a keyboard event matches a parsed shortcut

Parameters:
- `event`: - The keyboard event to check
- `parsed`: - The parsed shortcut to match against

Returns: `true` if the event matches the shortcut

## ModifierAliases

- Kind: `const`
- Source: `src/constants.ts:69:14`

Alias map from user-facing modifier tokens to canonical modifier keys.

## ModifierChain

- Kind: `type`
- Source: `src/types.ts:216:1`

Chainable modifier builder with type-safe exhaustion
Each modifier can only be used once in a chain

## ModifierDisplayOrder

- Kind: `const`
- Source: `src/constants.ts:156:14`

Platform-specific canonical order for modifier rendering and combo normalization.

## ModifierDisplaySymbols

- Kind: `const`
- Source: `src/constants.ts:134:14`

Platform-specific display labels/symbols for modifier keys.

## ModifierFlags

- Kind: `type`
- Source: `src/types.ts:39:1`

Internal modifier state flags

## ModifierKey

- Kind: `const`
- Source: `src/constants.ts:59:14`

Canonical modifier token names used internally across parsing/formatting.

## ModifierName

- Kind: `type`
- Source: `src/types.ts:36:1`

Modifier key names used in the chainable API

## ModifierState

- Kind: `type`
- Source: `src/types.ts:47:1`

Modifier key state from a keyboard event

## NavigationKey

- Kind: `type`
- Source: `src/types.ts:13:1`

Arrow and navigation keys

## NumericKey

- Kind: `type`
- Source: `src/types.ts:7:1`

Number keys 0-9

## ParsedShortcut

- Kind: `type`
- Source: `src/types.ts:55:1`

Result of parsing a shortcut string

## parseShortcut

- Kind: `function`
- Source: `src/parser.ts:20:1`
- Signature: `(shortcut: string): ParsedShortcut`

Parse a shortcut string into its components

Parameters:
- `shortcut`: - Shortcut string (e.g., "cmd+s", "ctrl+shift+p")

Returns: Parsed shortcut with modifiers, key, and original string

Examples:
```ts
```ts
const parsed = parseShortcut("cmd+s")
// { modifiers: { meta: true, ... }, key: "s", original: "cmd+s" }
```
```

## parseShortcuts

- Kind: `function`
- Source: `src/parser.ts:71:1`
- Signature: `(shortcuts: string | string[]): ParsedShortcut[]`

Parse multiple shortcut strings

Parameters:
- `shortcuts`: - Single shortcut or array of shortcuts

Returns: Array of parsed shortcuts

## Platform

- Kind: `const`
- Source: `src/constants.ts:11:14`

Public platform constant alias (`Platform.MAC`, `Platform.WINDOWS`, `Platform.LINUX`).

## registerShortcutMap

- Kind: `function`
- Source: `src/hook.ts:146:1`
- Signature: `<T extends ShortcutMap>(builder: ShortcutBuilder, shortcutMap: T): ShortcutMapResult<T>`

Registers an object-based shortcut map in one call and returns per-action handles.

Parameters:
- `builder`: - Builder returned by `useShortcut()`
- `shortcutMap`: - Record of action ids to key bindings, handlers, and options

Returns: A result map with one `ShortcutResult` per shortcut id

Examples:
```ts
```ts
const $ = useShortcut()
const results = registerShortcutMap($, {
  save: { keys: "mod+s", handler: onSave },
  nav: { keys: ["g", "d"], handler: onGoDashboard },
})
```
```

## ShortcutAttemptDebugEvent

- Kind: `type`
- Source: `src/types.ts:131:1`

Per-shortcut debug payload describing how one registered shortcut was evaluated.

## ShortcutAttemptStatus

- Kind: `type`
- Source: `src/types.ts:97:1`

High-level match status for one shortcut attempt against the current keyboard input.

## ShortcutBuilder

- Kind: `type`
- Source: `src/types.ts:265:1`

The main shortcut builder interface returned by `useShortcut()`

## ShortcutConflict

- Kind: `type`
- Source: `src/types.ts:90:1`

Conflict metadata emitted when two registered shortcuts overlap.

## ShortcutDebugEvent

- Kind: `type`
- Source: `src/types.ts:146:1`

Global debug payload emitted for every processed keyboard event.

## ShortcutDebugInput

- Kind: `type`
- Source: `src/types.ts:119:1`

Normalized view of the keyboard input that triggered debug processing.

## ShortcutDebugOptions

- Kind: `type`
- Source: `src/types.ts:152:1`

Runtime debug configuration for console/debug-stream metadata.

## ShortcutDebugStep

- Kind: `type`
- Source: `src/types.ts:110:1`

Debug metadata for one step in a combo or multi-step shortcut sequence.

## ShortcutDebugToken

- Kind: `type`
- Source: `src/types.ts:103:1`

Debug metadata for one expected token in a shortcut step.

## ShortcutDebugTokenStatus

- Kind: `type`
- Source: `src/types.ts:100:1`

Token-level verdict for modifiers and keys inside debug attempt payloads.

## ShortcutGroup

- Kind: `type`
- Source: `src/types.ts:336:1`

Imperative grouping controller for binding/unbinding many shortcut registrations together.

## ShortcutHandler

- Kind: `type`
- Source: `src/types.ts:67:1`

Handler function called when a shortcut is triggered

Parameters:
- `event`: - The keyboard event that triggered the shortcut

## ShortcutMap

- Kind: `type`
- Source: `src/types.ts:328:1`

Bulk registration shape mapping action ids to key+handler definitions.

## ShortcutMapEntry

- Kind: `type`
- Source: `src/types.ts:321:1`

Single shortcut-map entry used by `registerShortcutMap` and `useShortcutMap`.

## ShortcutMapResult

- Kind: `type`
- Source: `src/types.ts:331:1`

Return type for map registrations, keyed by the same ids as the source map.

## ShortcutRecordingOptions

- Kind: `type`
- Source: `src/types.ts:256:1`

Options for `ShortcutBuilder.record()` and low-level recording flows.

## ShortcutResult

- Kind: `type`
- Source: `src/types.ts:193:1`

Result object returned when registering a shortcut
Provides control over the shortcut and display information

## ShortcutScope

- Kind: `type`
- Source: `src/types.ts:87:1`

Scope selector used to enable/disable subsets of shortcuts at runtime.

## SpecialKey

- Kind: `type`
- Source: `src/types.ts:19:1`

Special action keys like Enter, Escape, Tab

## SpecialKeyMap

- Kind: `const`
- Source: `src/constants.ts:92:14`

Alias map from human shortcut key tokens to `KeyboardEvent.key`-compatible values.

## SymbolKey

- Kind: `type`
- Source: `src/types.ts:24:1`

Symbol and punctuation keys

## useShortcut

- Kind: `function`
- Source: `src/hook.ts:187:1`
- Signature: `(options?: UseShortcutOptions): ShortcutBuilder`

React hook for registering chainable keyboard shortcuts

Parameters:
- `options`: - Configuration options for the hook

Returns: A chainable shortcut builder (`$`)

Examples:
```ts
```ts
const $ = useShortcut({ activeScopes: ["editor"] })
$.mod.key("s").on((event) => {
  event.preventDefault()
  saveDocument()
})
```
```

## useShortcutGroup

- Kind: `function`
- Source: `src/hook.ts:324:1`
- Signature: `(): ShortcutGroup`

React hook that returns a stable `ShortcutGroup` instance.

Returns: A memoized `ShortcutGroup` tied to the component lifecycle

Examples:
```ts
```ts
const group = useShortcutGroup()
```
```

## useShortcutMap

- Kind: `function`
- Source: `src/hook.ts:239:1`
- Signature: `<T extends ShortcutMap>(shortcutMap: T, options?: UseShortcutOptions): ShortcutMapResult<T>`

React hook that registers a shortcut map and automatically unbinds on cleanup.

Parameters:
- `shortcutMap`: - Record of action ids to key bindings, handlers, and options
- `options`: - Same options as `useShortcut()`

Returns: A map of `ShortcutResult` keyed by your shortcut ids

Examples:
```ts
```ts
const mapResults = useShortcutMap({
  save: { keys: "mod+s", handler: onSave },
  close: { keys: "escape", handler: onClose },
})
```
```

## UseShortcutOptions

- Kind: `type`
- Source: `src/types.ts:295:1`

Options for the `useShortcut` hook

