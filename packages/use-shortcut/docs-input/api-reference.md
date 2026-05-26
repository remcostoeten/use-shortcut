# API Reference (Generated)

Generated from public exports in `src/index.ts`.

## ActionKey

- Kind: `type`
- Source: `src/types.ts:39:1`

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
- Source: `src/hook.ts:445:1`
- Signature: `(): ShortcutGroup`

Creates an imperative group controller for many shortcut registrations.

Returns: A `ShortcutGroup` that can add and unbind multiple shortcuts together

Examples:
```ts
const group = createShortcutGroup()
group.add($.mod.key("s").on(onSave))
group.add($.key("escape").on(onClose))
group.unbindAll()
```

## detectPlatform

- Kind: `function`
- Source: `src/constants.ts:19:1`
- Signature: `(): PlatformType`

Detect the current OS platform for modifier normalization and display formatting.
Result is memoized for the page lifecycle.

## ExceptPredicate

- Kind: `type`
- Source: `src/types.ts:81:1`

Custom predicate for excluding shortcuts in certain conditions

Parameters:
- `event`: - The keyboard event to evaluate

Returns: `true` to skip the shortcut, `false` to allow it

## ExceptPreset

- Kind: `type`
- Source: `src/types.ts:91:1`

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
formatShortcut("cmd+s") // "⌘S" on Mac, "Ctrl+S" on Windows
formatShortcut("ctrl+shift+p", "mac") // "⌃⇧P"
```

## FunctionKey

- Kind: `type`
- Source: `src/types.ts:10:1`

Function keys F1-F12

## HandlerOptions

- Kind: `type`
- Source: `src/types.ts:173:1`

Options for shortcut handler registration

## KeyChain

- Kind: `type`
- Source: `src/types.ts:242:1`

Chain state after calling `.key()` - ready to attach a handler

## matchesAnyShortcut

- Kind: `function`
- Source: `src/parser.ts:155:1`
- Signature: `(event: KeyboardEvent, parsedShortcuts: ParsedShortcut[]): boolean`

Check if a keyboard event matches any of the parsed shortcuts

Parameters:
- `event`: - The keyboard event to check
- `parsedShortcuts`: - Array of parsed shortcuts to match against

Returns: `true` if the event matches any shortcut

## matchesShortcut

- Kind: `function`
- Source: `src/parser.ts:133:1`
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
- Source: `src/types.ts:223:1`

Chainable modifier builder with type-safe exhaustion
Each modifier can only be used once in a chain

## ModifierDisplayOrder

- Kind: `const`
- Source: `src/constants.ts:173:14`

Platform-specific canonical order for modifier rendering and combo normalization.

## ModifierDisplaySymbols

- Kind: `const`
- Source: `src/constants.ts:151:14`

Platform-specific display labels/symbols for modifier keys.

## ModifierFlags

- Kind: `type`
- Source: `src/types.ts:45:1`

Internal modifier state flags

## ModifierKey

- Kind: `const`
- Source: `src/constants.ts:59:14`

Canonical modifier token names used internally across parsing/formatting.

## ModifierName

- Kind: `type`
- Source: `src/types.ts:42:1`

Modifier key names used in the chainable API

## ModifierState

- Kind: `type`
- Source: `src/types.ts:54:1`

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
- Source: `src/types.ts:62:1`

Result of parsing a shortcut string

## parseShortcut

- Kind: `function`
- Source: `src/parser.ts:57:1`
- Signature: `(shortcut: string, platform?: PlatformType): ParsedShortcut`

Parse a shortcut string into its components

Parameters:
- `shortcut`: - Shortcut string (e.g., "cmd+s", "ctrl+shift+p")

Returns: Parsed shortcut with modifiers, key, and original string

Examples:
```ts
const parsed = parseShortcut("cmd+s")
// { modifiers: { meta: true, ... }, key: "s", original: "cmd+s" }
```

## parseShortcuts

- Kind: `function`
- Source: `src/parser.ts:106:1`
- Signature: `(shortcuts: string | string[], platform?: PlatformType): ParsedShortcut[]`

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
- Source: `src/hook.ts:191:1`
- Signature: `<T extends ShortcutMap>(builder: ShortcutBuilder, shortcutMap: T): ShortcutMapResult<T>`

Registers an object-based shortcut map in one call and returns per-action handles.

Parameters:
- `builder`: - Builder returned by `useShortcut()`
- `shortcutMap`: - Record of action ids to key bindings, handlers, and options

Returns: A result map with one `ShortcutResult` per shortcut id

Examples:
```ts
const $ = useShortcut()
const group = useShortcutGroup()

useEffect(() => {
  const results = registerShortcutMap($, {
    save: { keys: "mod+s", handler: onSave },
    nav: { keys: "g then d", handler: onGoDashboard },
  })
  group.addMany(results)

  return () => group.unbindAll()
}, [$, group, onSave, onGoDashboard])
```

## ShortcutAttemptDebugEvent

- Kind: `type`
- Source: `src/types.ts:138:1`

Per-shortcut debug payload describing how one registered shortcut was evaluated.

## ShortcutAttemptStatus

- Kind: `type`
- Source: `src/types.ts:104:1`

High-level match status for one shortcut attempt against the current keyboard input.

## ShortcutBinding

- Kind: `type`
- Source: `src/types.ts:341:1`

Declarative single shortcut binding used by `useShortcutBinding`.

## ShortcutBuilder

- Kind: `type`
- Source: `src/types.ts:278:1`

The main shortcut builder interface returned by `useShortcut()`

## ShortcutConflict

- Kind: `type`
- Source: `src/types.ts:97:1`

Conflict metadata emitted when two registered shortcuts overlap.

## ShortcutDebugEvent

- Kind: `type`
- Source: `src/types.ts:153:1`

Global debug payload emitted for every processed keyboard event.

## ShortcutDebugInput

- Kind: `type`
- Source: `src/types.ts:126:1`

Normalized view of the keyboard input that triggered debug processing.

## ShortcutDebugOptions

- Kind: `type`
- Source: `src/types.ts:159:1`

Runtime debug configuration for console/debug-stream metadata.

## ShortcutDebugStep

- Kind: `type`
- Source: `src/types.ts:117:1`

Debug metadata for one step in a combo or multi-step shortcut sequence.

## ShortcutDebugToken

- Kind: `type`
- Source: `src/types.ts:110:1`

Debug metadata for one expected token in a shortcut step.

## ShortcutDebugTokenStatus

- Kind: `type`
- Source: `src/types.ts:107:1`

Token-level verdict for modifiers and keys inside debug attempt payloads.

## ShortcutGroup

- Kind: `type`
- Source: `src/types.ts:352:1`

Imperative grouping controller for binding/unbinding many shortcut registrations together.

## ShortcutHandler

- Kind: `type`
- Source: `src/types.ts:74:1`

Handler function called when a shortcut is triggered

Parameters:
- `event`: - The keyboard event that triggered the shortcut

## ShortcutMap

- Kind: `type`
- Source: `src/types.ts:344:1`

Bulk registration shape mapping action ids to key+handler definitions.

## ShortcutMapEntry

- Kind: `type`
- Source: `src/types.ts:334:1`

Single shortcut-map entry used by `registerShortcutMap` and `useShortcutMap`.

## ShortcutMapResult

- Kind: `type`
- Source: `src/types.ts:347:1`

Return type for map registrations, keyed by the same ids as the source map.

## ShortcutRecordingOptions

- Kind: `type`
- Source: `src/types.ts:269:1`

Options for `ShortcutBuilder.record()` and low-level recording flows.

## ShortcutResult

- Kind: `type`
- Source: `src/types.ts:200:1`

Result object returned when registering a shortcut
Provides control over the shortcut and display information

## ShortcutScope

- Kind: `type`
- Source: `src/types.ts:94:1`

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
- Source: `src/hook.ts:237:1`
- Signature: `(options?: UseShortcutOptions): ShortcutBuilder`

React hook for registering chainable keyboard shortcuts

Parameters:
- `options`: - Configuration options for the hook

Returns: A chainable shortcut builder (`$`)

Examples:
```ts
const $ = useShortcut({ activeScopes: ["editor"] })

useEffect(() => {
  const saveShortcut = $.mod.key("s").on((event) => {
    event.preventDefault()
    saveDocument()
  })

  return () => saveShortcut.unbind()
}, [$, saveDocument])
```

## useShortcutBinding

- Kind: `function`
- Source: `src/hook.ts:308:1`
- Signature: `(keys: string | string[], handler: ShortcutHandler, options?: HandlerOptions, shortcutOptions?: UseShortcutOptions): ShortcutResult`

React hook for one cleanup-safe shortcut binding.

Parameters:
- `keys`: - Shortcut combo string or combo array, such as `"mod+s"` or `["escape", "mod+d"]`
- `handler`: - Handler invoked when the shortcut matches
- `options`: - Per-binding options such as `preventDefault`, `scopes`, and `priority`
- `shortcutOptions`: - Hook-level options such as `target`, `eventType`, and `activeScopes`
- `binding`: - Object containing `keys`, `handler`, and optional per-binding `options`
- `shortcutOptions`: - Hook-level options such as `target`, `eventType`, and `activeScopes`

Returns: A stable `ShortcutResult` handle. Before the effect runs, the handle is disabled and uses the provided keys as its display text.

Examples:
```ts
const saveShortcut = useShortcutBinding("mod+s", saveDocument, {
  description: "Save document",
  preventDefault: true,
})
```
```ts
const closeShortcut = useShortcutBinding({
  keys: ["escape", "mod+d"],
  handler: closeDialog,
  options: { description: "Close dialog" },
})
```

## useShortcutGroup

- Kind: `function`
- Source: `src/hook.ts:483:1`
- Signature: `(): ShortcutGroup`

React hook that returns a stable `ShortcutGroup` instance.

Returns: A memoized `ShortcutGroup` tied to the component lifecycle

Examples:
```ts
const group = useShortcutGroup()
```

## useShortcutMap

- Kind: `function`
- Source: `src/hook.ts:386:1`
- Signature: `<T extends ShortcutMap>(shortcutMap: T, options?: UseShortcutOptions): ShortcutMapResult<T>`

React hook that registers a shortcut map and automatically unbinds on cleanup.

Parameters:
- `shortcutMap`: - Record of action ids to key bindings, handlers, and options
- `options`: - Same options as `useShortcut()`

Returns: A map of `ShortcutResult` keyed by your shortcut ids

Examples:
```ts
const shortcuts = useMemo(() => ({
  save: { keys: "mod+s", handler: onSave },
  close: { keys: "escape", handler: onClose },
}), [onSave, onClose])

const mapResults = useShortcutMap(shortcuts)
```

## UseShortcutOptions

- Kind: `type`
- Source: `src/types.ts:308:1`

Options for the `useShortcut` hook

