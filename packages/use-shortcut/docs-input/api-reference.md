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

## canonicalizeShortcut

- Kind: `function`
- Source: `src/rebinding.ts:37:1`
- Signature: `(combo: string, platform?: PlatformType): string`

Reduce a combo to the canonical form the dispatcher matches on, so two
spellings of one binding compare and store as the same string. Modifiers are
ordered, aliases resolved, and `mod` is expanded for the target platform.

Use it as the storage form for user rebinds; a recorded `"Ctrl + K"` and a
default of `"mod+k"` should not persist as two different settings values.

Parameters:
- `combo`: - Shortcut string, chord or sequence
- `platform`: - Optional platform override (default: auto-detect)

Returns: Canonical combo string, sequence steps rejoined with `" then "`

Examples:
```ts
canonicalizeShortcut("Ctrl + K", "windows") // "ctrl+k"
canonicalizeShortcut("mod+k", "windows") // "ctrl+k"
canonicalizeShortcut("g then D") // "g then d"
```

## createShortcutGroup

- Kind: `function`
- Source: `src/hook.ts:539:1`
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

## ExceptOption

- Kind: `type`
- Source: `src/types.ts:111:1`

Everything `except` accepts: one preset, one predicate, or an array mixing
both. The array form is what lets an app keep the built-in presets while
adding a guard of its own, instead of dropping to a lone predicate and
reimplementing the presets by hand.

Examples:
```ts
except: ["typing", "modal", event => inSidebarTree(event.target)]
```

## ExceptPredicate

- Kind: `type`
- Source: `src/types.ts:87:1`

Custom predicate for excluding shortcuts in certain conditions

Parameters:
- `event`: - The keyboard event to evaluate

Returns: `true` to skip the shortcut, `false` to allow it

## ExceptPreset

- Kind: `type`
- Source: `src/types.ts:98:1`

Built-in exception presets for common scenarios
- "input" - Skip when focused on input, textarea, or select
- "editable" - Skip when focused on contentEditable elements
- "typing" - Skip in any text input context (combines input + editable)
- "modal" - Skip when a modal is open (a native `dialog` promoted by
  `showModal()`, `[data-modal="true"]`, or `[role="dialog"]`)
- "disabled" - Skip when focused element is disabled

## findShortcutConflict

- Kind: `function`
- Source: `src/rebinding.ts:121:1`
- Signature: `(combo: string, existing: readonly string[], platform?: PlatformType): { combo: string; reason: "exact" | "sequence-prefix"; }`

The first already-bound combo that `combo` would collide with, or `null` when
it is free. Wraps {@link shortcutConflict} for the common rebinding-UI case
of validating one candidate against every existing binding.

Unparseable entries in `existing` are skipped rather than thrown on, so one
bad stored override cannot break the whole check.

Parameters:
- `combo`: - The candidate shortcut string
- `existing`: - Combos already bound elsewhere
- `platform`: - Optional platform override (default: auto-detect)

Returns: The colliding combo and reason, or `null` when there is no conflict

Examples:
```ts
findShortcutConflict("mod+k", ["mod+s", "ctrl+k"], "windows")
// { combo: "ctrl+k", reason: "exact" }
```

## formatShortcut

- Kind: `function`
- Source: `src/formatter.ts:105:1`
- Signature: `(shortcut: string, platform?: PlatformType): string`

Format a shortcut string for display with platform-aware symbols

Sequences are formatted step by step and rejoined with `" then "`, matching
how they are written in a combo string.

Parameters:
- `shortcut`: - Shortcut string (e.g., `"cmd+s"`, `"g then d"`)
- `platform`: - Optional platform override (default: auto-detect)

Returns: Formatted display string (e.g., "⌘S" on Mac, "Ctrl+S" on Windows)

Examples:
```ts
formatShortcut("cmd+s") // "⌘S" on Mac, "Ctrl+S" on Windows
formatShortcut("ctrl+shift+p", "mac") // "⌃⇧P"
formatShortcut("g then d", "windows") // "G then D"
```

## formatShortcutSteps

- Kind: `function`
- Source: `src/formatter.ts:77:1`
- Signature: `(shortcut: string, platform?: PlatformType): string[]`

Format each step of a shortcut separately, for UIs that render one `<kbd>`
per step. A plain chord yields a single entry; a sequence yields one entry
per step, so a cheat sheet never has to re-split a joined string.

Parameters:
- `shortcut`: - Shortcut string, chord or sequence (e.g., `"g then d"`)
- `platform`: - Optional platform override (default: auto-detect)

Returns: One formatted display string per sequence step

Examples:
```ts
formatShortcutSteps("g then d", "windows") // ["G", "D"]
formatShortcutSteps("mod+s", "mac") // ["⌘S"]
```

## FunctionKey

- Kind: `type`
- Source: `src/types.ts:10:1`

Function keys F1-F12

## getModifiersFromEvent

- Kind: `function`
- Source: `src/parser.ts:167:1`
- Signature: `(event: KeyboardEvent): ModifierState`

Extract modifier state from a keyboard event

Parameters:
- `event`: - The keyboard event

Returns: Object with meta, ctrl, alt, shift boolean flags

## getModifierSymbols

- Kind: `function`
- Source: `src/formatter.ts:126:1`
- Signature: `(platform?: PlatformType): Record<ModifierKeyType, string>`

Get the modifier key symbols for a platform

Parameters:
- `platform`: - Optional platform override (default: auto-detect)

Returns: Object mapping modifier keys to display symbols

Examples:
```ts
getModifierSymbols("mac") // { meta: "⌘", ctrl: "⌃", alt: "⌥", shift: "⇧" }
```

## HandlerOptions

- Kind: `type`
- Source: `src/types.ts:196:1`

Options for shortcut handler registration

## KeyChain

- Kind: `type`
- Source: `src/types.ts:265:1`

Chain state after calling `.key()` - ready to attach a handler

## matchesAnyShortcut

- Kind: `function`
- Source: `src/parser.ts:208:1`
- Signature: `(event: KeyboardEvent, parsedShortcuts: ParsedShortcut[]): boolean`

Check if a keyboard event matches any of the parsed shortcuts

Parameters:
- `event`: - The keyboard event to check
- `parsedShortcuts`: - Array of parsed shortcuts to match against

Returns: `true` if the event matches any shortcut

## matchesShortcut

- Kind: `function`
- Source: `src/parser.ts:183:1`
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
- Source: `src/types.ts:246:1`

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
- Source: `src/parser.ts:105:1`
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
- Source: `src/parser.ts:156:1`
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
- Source: `src/hook.ts:216:1`
- Signature: `<T extends ShortcutMap>(builder: ShortcutBuilder, shortcutMap: T): ShortcutMapResult<T>`

Registers an object-based shortcut map in one call and returns per-action handles.

`keys` accepts one combo (`"mod+s"`), one sequence (`"g then d"`), or an
array of alternatives (`["escape", "mod+d"]`) where any alternative fires
the handler. Each alternative may itself be a sequence string.

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
    close: { keys: ["escape", "mod+d"], handler: onClose },
  })
  group.addMany(results)

  return () => group.unbindAll()
}, [$, group, onSave, onGoDashboard, onClose])
```

## sameShortcut

- Kind: `function`
- Source: `src/rebinding.ts:58:1`
- Signature: `(a: string, b: string, platform?: PlatformType): boolean`

Whether two combos resolve to the same binding. Compares canonical forms
rather than raw text, so `"mod+k"`, `"Ctrl + K"`, and a recorded `"ctrl+k"`
are equal on platforms where `mod` means ctrl.

Parameters:
- `a`: - First shortcut string
- `b`: - Second shortcut string
- `platform`: - Optional platform override (default: auto-detect)

Returns: `true` when both combos would match the same keystrokes

Examples:
```ts
sameShortcut("mod+k", "ctrl+k", "windows") // true
sameShortcut("mod+k", "mod+j") // false
```

## ShortcutAttemptDebugEvent

- Kind: `type`
- Source: `src/types.ts:161:1`

Per-shortcut debug payload describing how one registered shortcut was evaluated.

## ShortcutAttemptStatus

- Kind: `type`
- Source: `src/types.ts:127:1`

High-level match status for one shortcut attempt against the current keyboard input.

## ShortcutBinding

- Kind: `type`
- Source: `src/types.ts:375:1`

Declarative single shortcut binding used by `useShortcutBinding`.

## ShortcutBuilder

- Kind: `type`
- Source: `src/types.ts:303:1`

The main shortcut builder interface returned by `useShortcut()`

## shortcutConflict

- Kind: `function`
- Source: `src/rebinding.ts:92:1`
- Signature: `(a: string, b: string, platform?: PlatformType): "exact" | "sequence-prefix"`

How two combos collide, or `null` when they can coexist. `"exact"` means they
match the same keystrokes; `"sequence-prefix"` means one is a leading prefix
of the other, so the shorter would fire before the longer can complete.

This is the same test the registry applies when it warns about conflicts,
exposed so a rebinding UI can reject a combo before registering it.

Parameters:
- `a`: - First shortcut string
- `b`: - Second shortcut string
- `platform`: - Optional platform override (default: auto-detect)

Returns: The conflict reason, or `null` if the two can be bound together

Examples:
```ts
shortcutConflict("mod+k", "ctrl+k", "windows") // "exact"
shortcutConflict("g", "g then d") // "sequence-prefix"
shortcutConflict("mod+k", "mod+j") // null
```

## ShortcutConflict

- Kind: `type`
- Source: `src/types.ts:120:1`

Conflict metadata emitted when two registered shortcuts overlap.

## ShortcutDebugEvent

- Kind: `type`
- Source: `src/types.ts:176:1`

Global debug payload emitted for every processed keyboard event.

## ShortcutDebugInput

- Kind: `type`
- Source: `src/types.ts:149:1`

Normalized view of the keyboard input that triggered debug processing.

## ShortcutDebugOptions

- Kind: `type`
- Source: `src/types.ts:182:1`

Runtime debug configuration for console/debug-stream metadata.

## ShortcutDebugStep

- Kind: `type`
- Source: `src/types.ts:140:1`

Debug metadata for one step in a combo or multi-step shortcut sequence.

## ShortcutDebugToken

- Kind: `type`
- Source: `src/types.ts:133:1`

Debug metadata for one expected token in a shortcut step.

## ShortcutDebugTokenStatus

- Kind: `type`
- Source: `src/types.ts:130:1`

Token-level verdict for modifiers and keys inside debug attempt payloads.

## ShortcutGroup

- Kind: `type`
- Source: `src/types.ts:386:1`

Imperative grouping controller for binding/unbinding many shortcut registrations together.

## ShortcutHandler

- Kind: `type`
- Source: `src/types.ts:80:1`

Handler function called when a shortcut is triggered

Parameters:
- `event`: - The keyboard event that triggered the shortcut

## ShortcutMap

- Kind: `type`
- Source: `src/types.ts:378:1`

Bulk registration shape mapping action ids to key+handler definitions.

## ShortcutMapEntry

- Kind: `type`
- Source: `src/types.ts:363:1`

Single shortcut-map entry used by `registerShortcutMap` and `useShortcutMap`.

## ShortcutMapResult

- Kind: `type`
- Source: `src/types.ts:381:1`

Return type for map registrations, keyed by the same ids as the source map.

## ShortcutRecordingOptions

- Kind: `type`
- Source: `src/types.ts:292:1`

Options for `ShortcutBuilder.record()` and low-level recording flows.

## ShortcutResult

- Kind: `type`
- Source: `src/types.ts:223:1`

Result object returned when registering a shortcut
Provides control over the shortcut and display information

## ShortcutScope

- Kind: `type`
- Source: `src/types.ts:117:1`

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
- Source: `src/hook.ts:268:1`
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
- Source: `src/hook.ts:359:1`
- Signature: `(keys: string | string[], handler: ShortcutHandler, options?: HandlerOptions, shortcutOptions?: UseShortcutOptions): ShortcutResult`

React hook for one cleanup-safe shortcut binding.

Parameters:
- `keys`: - Shortcut combo string, sequence string, or array of alternative combos, such as `"mod+s"`, `"g then d"`, or `["escape", "mod+d"]`
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
- Source: `src/hook.ts:577:1`
- Signature: `(): ShortcutGroup`

React hook that returns a stable `ShortcutGroup` instance.

Returns: A memoized `ShortcutGroup` tied to the component lifecycle

Examples:
```ts
const group = useShortcutGroup()
```

## useShortcutMap

- Kind: `function`
- Source: `src/hook.ts:459:1`
- Signature: `<T extends ShortcutMap>(shortcutMap: T, options?: UseShortcutOptions): ShortcutMapResult<T>`

React hook that registers a shortcut map and automatically unbinds on cleanup.

Handlers are kept in a ref, so inline handler functions never cause
re-registration. The returned map and its per-id results are stable object
references, safe to destructure at any point in the component lifecycle.

Parameters:
- `shortcutMap`: - Record of action ids to key bindings, handlers, and options
- `options`: - Same options as `useShortcut()`

Returns: A map of `ShortcutResult` keyed by your shortcut ids

Examples:
```ts
const { save, close } = useShortcutMap({
  save: { keys: "mod+s", handler: onSave },
  close: { keys: "escape", handler: onClose },
})
```

## UseShortcutOptions

- Kind: `type`
- Source: `src/types.ts:333:1`

Options for the `useShortcut` hook

