# Public API Inventory

This file lists what is publicly exposed today and should be documented for end users.

## NPM Package API (`@remcostoeten/use-shortcut`)

Source of truth: `src/index.ts`.

### Runtime constants and platform helpers

- `ModifierKey`
- `ModifierAliases`
- `SpecialKeyMap`
- `ModifierDisplaySymbols`
- `ModifierDisplayOrder`
- `Platform`
- `detectPlatform()`

### Parser/matcher functions

- `parseShortcut(shortcut)`
- `parseShortcuts(shortcuts)`
- `matchesShortcut(event, parsed)`
- `matchesAnyShortcut(event, parsedShortcuts)`

### Formatting functions

- `formatShortcut(shortcut, platform?)`

### React hooks and registration helpers

- `useShortcut(options?)`

### Exported types (TypeScript API)

- `ModifierState`
- `ParsedShortcut`
- `ShortcutBuilder`
- `ShortcutResult`
- `ShortcutHandler`
- `HandlerOptions`
- `UseShortcutOptions`
- `ActionKey`
- `ModifierName`
- `ModifierFlags`
- `AlphaKey`
- `NumericKey`
- `FunctionKey`
- `NavigationKey`
- `SpecialKey`
- `SymbolKey`
- `ModifierChain`
- `KeyChain`
- `ExceptPreset`
- `ExceptPredicate`
- `ShortcutScope`
- `ShortcutConflict`
- `ShortcutRecordingOptions`

## Package Export Capabilities

### `useShortcut(options?)`

Possible to do: register keyboard shortcuts with a chainable API, scopes, exceptions, sequences, and recording.

### `formatShortcut(shortcut, platform?)`

Possible to do: render human-friendly shortcut labels (for example `cmd+s` -> `⌘S` on macOS).

### `detectPlatform()`

Possible to do: resolve current platform token (`mac`, `windows`, `linux`) for platform-aware behavior.

### `parseShortcut(shortcut)`

Possible to do: convert a shortcut string into normalized modifiers + key structure.

### `parseShortcuts(shortcuts)`

Possible to do: parse one or multiple shortcut expressions into normalized parsed objects.

### `matchesShortcut(event, parsed)`

Possible to do: test whether a keyboard event matches one parsed shortcut definition.

### `matchesAnyShortcut(event, parsedShortcuts)`

Possible to do: test whether an event matches any shortcut in a parsed shortcut list.

### `ModifierKey`

Possible to do: reference canonical modifier constants (`META`, `CTRL`, `ALT`, `SHIFT`).

### `ModifierAliases`

Possible to do: map user tokens (`cmd`, `option`, `mod`, etc.) to canonical modifier keys.

### `SpecialKeyMap`

Possible to do: normalize key aliases (`esc`, `spacebar`, arrows, etc.) to canonical key values.

### `ModifierDisplaySymbols`

Possible to do: fetch platform-specific labels/symbols for modifier rendering.

### `ModifierDisplayOrder`

Possible to do: fetch canonical modifier ordering per platform for display/normalization.

### `Platform`

Possible to do: use platform constants (`Platform.MAC`, `Platform.WINDOWS`, `Platform.LINUX`).

### `ActionKey`

Possible to do: type key arguments accepted by `.key(...)` in shortcut chains.

### `AlphaKey`

Possible to do: constrain letter-only key inputs (`a`-`z`) in type-safe APIs.

### `NumericKey`

Possible to do: constrain numeric key inputs (`0`-`9`) in type-safe APIs.

### `FunctionKey`

Possible to do: constrain function-key inputs (`f1`-`f12`) in type-safe APIs.

### `NavigationKey`

Possible to do: constrain navigation key inputs (arrows/home/end/page keys).

### `SpecialKey`

Possible to do: constrain special action keys (`enter`, `escape`, `tab`, etc.).

### `SymbolKey`

Possible to do: constrain punctuation/symbol key inputs (`slash`, `comma`, etc.).

### `ModifierName`

Possible to do: type modifier token names used in chainable APIs.

### `ModifierFlags`

Possible to do: represent boolean modifier state for builder/runtime internals and typing.

### `ModifierState`

Possible to do: represent event-style modifier state (`meta/ctrl/alt/shift`) in parsed data.

### `ParsedShortcut`

Possible to do: type parsed shortcut objects returned by parser helpers.

### `ShortcutBuilder`

Possible to do: type the object returned by `useShortcut` for chain construction.

### `ShortcutResult`

Possible to do: type and control a registered shortcut (`unbind`, `enable`, `disable`, `trigger`, display metadata).

### `ShortcutHandler`

Possible to do: type handler callbacks receiving `KeyboardEvent`.

### `HandlerOptions`

Possible to do: configure per-shortcut behavior (`preventDefault`, `scopes`, `except`, `priority`, etc.).

### `UseShortcutOptions`

Possible to do: configure runtime-level hook behavior (`target`, `eventType`, `activeScopes`, `disabled`, etc.).

### `ModifierChain`

Possible to do: type-safe chained modifier composition (prevents duplicate modifier use in chain typing).

### `KeyChain`

Possible to do: type-safe chain operations after `.key(...)` (`on`, `then`, `except`, `in`).

### `ExceptPreset`

Possible to do: use built-in exception presets (`input`, `editable`, `typing`, `modal`, `disabled`).

### `ExceptPredicate`

Possible to do: provide custom event predicates for excluding shortcut execution.

### `ShortcutScope`

Possible to do: type named scope selectors for scoped shortcut activation.

### `ShortcutConflict`

Possible to do: type conflict event metadata (`exact` or `sequence-prefix` reason).

### `ShortcutRecordingOptions`

Possible to do: configure shortcut recording (`target`, `eventType`, `timeoutMs`).

## CLI Public Surface (`use-shortcut` bin)

Source of truth: `cli/index.ts`.

### Commands

- `use-shortcut init [--target hooks] [--force]`
- `use-shortcut init --architecture [--framework next|react] [--target src] [--dir shortcuts] [--force]`
- `use-shortcut scaffold [--framework next|react] [--target src] [--dir shortcuts] [--force]`
- `use-shortcut architecture [--framework next|react] [--target src] [--dir shortcuts] [--force]`

## Scaffolded App API (generated by CLI)

Source of truth: `cli/src/shortcuts/index.ts` and template equivalents in `cli/templates.ts`.

### Exposed from generated `shortcuts/index.ts`

- `ShortcutProvider`
- `useShortcutManager()`
- `shortcutRegistry`
- `defaultActiveScopes`
- `shortcutScopes`
- `ShortcutProviderProps` (type)
- `ShortcutActionId` (type)
- `ShortcutBindings` (type)
- `ShortcutScope` (type)
- `ShortcutContextValue` (type)
- `ShortcutActions` (type)
- `ShortcutHandlers` (type)
- `ShortcutMeta` (type)
- `ShortcutState` (type)

## Internal Naming Rule

- Internal helpers now use `_` prefix across `src/` and `cli/` sources.
- Internal helpers are intentionally not re-exported from `src/index.ts`.
- Documentation focus should stay on the public entries above.
