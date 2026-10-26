# Plan

Each step is done when `bun run check` passes. Every choice made along the way goes into `DECISIONS.md`.

## 0. Setup

- [x] Orphan branch `v3` in a worktree at `~/use-shortcut-v3`
- [x] Bun, TypeScript 6, Oxlint, oxfmt, `bun run check`
- [x] `DECISIONS.md`
- [x] Semantic types in `src/shared/types/semantic.ts`, derived from `src/shared/vocabulary.ts`
- [x] Type test proving `KeyName` and `Modifier` are closed unions

## 1. Core matcher

- [x] Key resolution: case, aliases, shifted characters, `+`
- [x] Steps: `mod` per platform, exact modifiers, Shift exceptions, left and right Shift
- [x] Trie with shared prefixes
- [x] Presses and combos
- [x] Sequences with timeout, wrong-key restart, overlap rule
- [x] Waits (`minDelay`), with build-time validation
- [x] Holds: start, release, tap vs hold, cancel, Mac Meta release
- [x] `interrupt`, `nextDeadline`, `advanceTime`
- [x] Ignore auto-repeat, IME composition and bare modifier keys
- [x] H5: the keydown that begins a hold is prevented
- [x] H7: no timeout while holding; the clock starts at release
- [x] M6: with Alt held the physical key (`event.code`) is matched

## 2. Browser layer

- [x] Convert `KeyboardEvent` to `KeyInput`
- [x] One `keydown` and `keyup` listener on the window (or a provider element)
- [x] Call `preventDefault` when the matcher asks for it
- [x] One timer aimed at `nextDeadline`, calling `advanceTime`
- [x] `interrupt` on window blur and `visibilitychange`
- [x] Skip inputs, textareas, selects and contenteditable by default
- [x] `allowInInputs` per binding (`shouldSkip`, wired per binding in the registry step)
- [x] `except` rules: `"typing"`, `"modal"`, `"disabled"`, custom predicate
- [x] Lazy platform detection, safe to import during server rendering
- [x] `throwInDev()` throws in development and warns in production (wired to unknown keys in the registry step)
- [x] happy-dom preloaded for `bun test`

## 3. Registry (plain JS API)

- [x] Add and remove bindings, rebuilding the matcher on change
- [x] Scopes: turn on and off, `in` per binding
- [x] Host as a scope: `web` and `desktop`, enabled from `detectHost()` (Tauri 2 only)
- [x] Dev warning when a `web` binding uses a combo browsers keep (`mod+w`, `mod+t`, `mod+n`, `mod+q`, ...)
- [x] Priority tiers: only the highest matching tier fires
- [x] Handles: `enable`, `disable`, `isEnabled`, `unbind`, `trigger`
- [x] Handle display: `combo` and a platform-aware `display` string
- [x] `list()` and `subscribe()` for help screens
- [x] Development warning for two bindings with the same combo in one active scope
- [x] Vanilla example works with only the registry and the browser layer (see `createRegistry` JSDoc)

## 4. React adapter

- [x] `createShortcuts({ scopes })` returning `shortcut`, `ShortcutProvider`, `ShortcutBoundary` (plain-JS twin in `src/chain/create.ts` returns `shortcut` and `registry`)
- [x] `ShortcutProvider`, `ShortcutBoundary`, `useRegistry`, `useBinding` and `useShortcutList` in `src/react`
- [x] `useBinding` registers in an effect and always calls the latest handler
- [x] No double registration in Strict Mode
- [x] Nested providers route each key to the innermost region
- [x] `inherit` on nested providers
- [x] Test that portals follow the React tree before relying on it
- [x] Server rendering renders without touching `window`
- [x] Tests with React Testing Library

## 5. Typed chain

- [x] Builder (`shortcut.mod.key("k").then(...)`) producing the step lists the registry takes
- [x] Port stage types from `~/dev/shortcut-lib`
- [x] Modifier exclusion so a modifier can't be added twice
- [x] Literal `combo` type on handles
- [x] Scope names inferred from `createShortcuts`
- [x] `.or` alternatives: one binding per alternative, one handle controlling all of them
- [x] JSDoc on every stage member, with `@name`, `@description` and `@example`
- [x] `@ts-expect-error` tests for every rule the types enforce
- [x] Autocomplete and hover tests through the TypeScript language service
- [x] Measure type-check time with 200 bindings: 1.20s against a 1.08s baseline (tsc check time, three runs each)

## 6. Browser tests

- [x] Playwright setup with `--workers=2`
- [x] Real focus moving into and out of inputs
- [x] Window blur during a hold
- [x] Real key repeat: not reproducible under Playwright; a synthetic `repeat: true` keydown is proven not to fire twice (E-section)
- [x] Spec acceptance scenarios that need a real browser

## 7. Release

- [x] tsdown build with `.` and `./react` exports
- [x] publint and attw pass (`bun run check:package`)
- [x] Bundle size: core entry 1.3 kB + shared chunk 38.6 kB (11.9 kB gzip), react entry 13 kB (4.5 kB gzip)
- [x] README landing page
- [ ] Squash to one commit before merging

## Later

- [ ] Match on the physical key (`event.code`)
- [ ] `onDebug` with matched, partial and mismatch events
- [ ] Rebinding helpers
- [ ] Tauri: `onFocusChanged` interrupt, `toAccelerator(combo)`, `.global()` through the global-shortcut plugin
