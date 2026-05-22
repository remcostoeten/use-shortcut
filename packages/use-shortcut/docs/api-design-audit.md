# API design audit

Date: 2026-05-22
Branch: `feat/use-shortcut-api-design`

## Current API posture

`useShortcutBinding()` should remain the default React API for one shortcut. It gives React ownership of registration and cleanup, returns a stable handle, and avoids the easiest misuse of calling the fluent builder during render without cleanup.

`useShortcut()` should stay available for advanced cases: debug streams, recording, imperative scope changes, groups, and fluent composition. It is powerful, but it is easier to misuse than the declarative hook.

`useShortcutMap()` is the right API for product surfaces with a fixed shortcut table. It gives one place to document labels, scopes, priorities, and handlers.

## Issues found

### Literal symbol parsing in declarative flows

`registerShortcutMap()` parsed each step by splitting on `+`, while `parseShortcut()` already supports literal symbols like `ctrl++` and `ctrl+-`. Because `useShortcutBinding()` delegates through `registerShortcutMap()`, the preferred API could fail for common zoom shortcuts.

Resolution: `registerShortcutMap()` now parses each step through `parseShortcut()` and applies the parsed modifier flags to the builder chain.

### Ambiguous `keys: string[]`

`ShortcutMapEntry.keys` currently accepts `string | string[]`, and arrays are interpreted as sequence steps. That is useful for `["g", "d"]`, but it can read like a list of alternative combos. The fluent `bind(["mod+k", "mod+p"])` API already uses arrays as alternatives, so this is a naming/expectation mismatch.

Recommendation for a future minor release: add clearer aliases without removing the current shape.

```ts
type ShortcutSequence = string | readonly string[]
type ShortcutAlternatives = readonly string[]

type ShortcutMapEntry = {
  keys: ShortcutSequence
  handler: ShortcutHandler
  options?: HandlerOptions
}
```

Recommendation for a future major release: consider renaming map entries to `sequence` and adding an explicit `alternatives` field if both behaviors need to exist in the same declarative API.

### Stable options ergonomics

`useShortcutBinding("mod+s", handler, { preventDefault: true })` is ergonomic, but inline option objects can cause re-registration on every render. The runtime handles cleanup correctly, but this is not ideal for busy components.

Recommendation: keep the current API, document that option objects should be stable in high-frequency renders, and consider shallow option comparison inside `useShortcutBinding()` and `useShortcutMap()` if profiling shows churn.

### Scope control API split

Scope activation currently lives on the fluent builder (`setScopes`, `enableScope`, `disableScope`, `getScopes`, `isScopeActive`). Declarative users may never touch the builder, so scoped apps need either `useShortcut()` solely for scope control or a separate app-level state.

Recommendation: add a scoped provider only if examples reveal repeated boilerplate. A provider should not be introduced just to wrap existing state.

## Example app direction

Build a focused `apps/shortcut-lab` example rather than expanding the package README demo. The app should behave like a small command-driven editor surface, not a landing page.

Core screens:

- Command palette with `mod+k`
- Editor pane with `mod+s`, `mod+z`, `mod+shift+z`, and `escape`
- Navigation sequence demo with `g then d`, `g then s`
- Debug console showing `onDebug()` and per-shortcut `onAttempt()` output
- Shortcut settings panel with recording via `$.record()`
- Scope toggle between `editor`, `palette`, and `global`

API coverage:

- `useShortcutBinding()` for one-off global actions
- `useShortcutMap()` for the editor shortcut table
- `useShortcut()` for debug, scope control, and recording
- `formatShortcut()` for display
- `parseShortcut()` only in diagnostics, not normal app code

Implementation constraints:

- Put the app under `apps/shortcut-lab` as a Vite React workspace.
- Depend on `@remcostoeten/use-shortcut` through the workspace package.
- Keep it package-consumer realistic: no internal imports from `packages/use-shortcut/src`.
- Include an accessible live region for shortcut feedback and debug status.
- Use URL state for selected panel/scope so examples are linkable.
