# Public API Inventory

This file lists the public package surface and the preferred entrypoint for each use case.

## Package Entrypoints

### `@remcostoeten/use-shortcut`

Compatibility barrel. Source of truth: `src/index.ts`.

### `@remcostoeten/use-shortcut/react`

Preferred React entrypoint. Source of truth: `src/react.ts`.

Exports:

- `useShortcut(options?)`
- `useShortcutMap(shortcutMap, options?)`
- `registerShortcutMap(builder, shortcutMap)`
- `createShortcutGroup()`
- `useShortcutGroup()`
- React-facing TypeScript types from `src/types.ts`

### `@remcostoeten/use-shortcut/parser`

Source of truth: `src/parser.ts`.

Exports:

- `parseShortcut(shortcut)`
- `parseShortcuts(shortcuts)`
- `matchesShortcut(event, parsed)`
- `matchesAnyShortcut(event, parsedShortcuts)`

### `@remcostoeten/use-shortcut/formatter`

Source of truth: `src/formatter.ts`.

Exports:

- `formatShortcut(shortcut, platform?)`
- `getModifierSymbols(platform?)`

### `@remcostoeten/use-shortcut/constants`

Source of truth: `src/constants.ts`.

Exports:

- `ModifierKey`
- `ModifierAliases`
- `SpecialKeyMap`
- `ModifierDisplaySymbols`
- `ModifierDisplayOrder`
- `Platform`
- `detectPlatform()`

## Full Root API (`@remcostoeten/use-shortcut`)

### Runtime constants and platform helpers

- `ModifierKey`
- `ModifierAliases`
- `SpecialKeyMap`
- `ModifierDisplaySymbols`
- `ModifierDisplayOrder`
- `Platform`
- `detectPlatform()`

### Parser and matcher functions

- `parseShortcut(shortcut)`
- `parseShortcuts(shortcuts)`
- `matchesShortcut(event, parsed)`
- `matchesAnyShortcut(event, parsedShortcuts)`

### Formatting functions

- `formatShortcut(shortcut, platform?)`

### React hooks and registration helpers

- `useShortcut(options?)`
- `useShortcutMap(shortcutMap, options?)`
- `registerShortcutMap(builder, shortcutMap)`
- `createShortcutGroup()`
- `useShortcutGroup()`

### Exported types

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
- `ShortcutAttemptStatus`
- `ShortcutDebugTokenStatus`
- `ShortcutDebugToken`
- `ShortcutDebugStep`
- `ShortcutDebugInput`
- `ShortcutAttemptDebugEvent`
- `ShortcutDebugEvent`
- `ShortcutDebugOptions`
- `ShortcutRecordingOptions`
- `ShortcutMapEntry`
- `ShortcutMap`
- `ShortcutMapResult`
- `ShortcutGroup`

## Documentation Rule

- Prefer the narrowest public entrypoint that matches the use case.
- Keep internal `_`-prefixed helpers out of end-user docs.
