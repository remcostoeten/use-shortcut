# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.5.1] - 2026-08-15

### Fixed

- The `modal` except-preset now detects native dialogs. It previously matched only `[data-modal="true"]` and `[role="dialog"]`, so a `<dialog>` opened with `showModal()` — the accessible, top-layer-correct way to build a modal — did not suppress shortcuts, and global keys kept firing underneath it. Where the `:modal` pseudo-class is supported the preset matches only dialogs actually promoted to the top layer; elsewhere it falls back to `dialog[open]`.

### Added

- `except` accepts an array mixing built-in presets and custom predicates, for example `["typing", "modal", event => inSidebarTree(event.target)]`. Previously a binding that needed one app-specific guard had to pass a lone predicate and reimplement the presets by hand. The single-preset, preset-array, and single-predicate forms are unchanged. The combined type is exported as `ExceptOption`.
- `formatShortcutSteps(shortcut, platform?)` returns one display string per sequence step, for cheat sheets that render a `<kbd>` per step.
- New `@remcostoeten/use-shortcut/rebinding` entrypoint, also re-exported from the root barrel, with the primitives a "customize shortcuts" UI needs after recording a combo: `canonicalizeShortcut` for a storage-safe canonical form, `sameShortcut` for equality by meaning rather than text, and `shortcutConflict` / `findShortcutConflict` to reject a candidate before registering it. These apply the same canonicalization and conflict rules the registry uses internally.

### Changed

- `formatShortcut` understands sequences. `formatShortcut("g then d")` previously parsed the whole string as a single chord and returned garbage (`"THENGT"`); it now formats each step and rejoins with `" then "`. It also throws `Invalid shortcut` on a blank combo, matching `parseShortcut`.

## [2.5.0] - 2026-08-13

Prepared but never published to npm; its entries ship as part of 2.5.1.

### Fixed

- Array `keys` in `useShortcutBinding`, `useShortcutMap`, and `registerShortcutMap` now register alternatives (any one fires the handler) as documented, instead of silently becoming a multi-step sequence. Each alternative may itself be a sequence string such as `"g then k"`.
- Shifted symbol shortcuts such as `shift+2` now match the shifted character the browser reports (`@`), including through the dispatch fast path (US layout).
- Closed a race where an imperative `.on()` call between paint and the passive-effect flush was mistaken for a render binding and silently reconciled away.
- `useShortcutBinding` no longer unbinds and re-registers on every render when given inline arrays, options objects, or handler functions; handlers are kept in a ref and keys/options are compared structurally.
- Unmount now clears pending delayed-handler timeouts and cancels in-flight recordings.
- `trigger()` respects `isEnabled` and synthesizes the bound key and modifier data on the dispatched event instead of an empty `KeyboardEvent`.
- Hook-level `disabled` is no longer baked into each binding at registration; it is checked live at dispatch (and in `trigger()`). Previously a hook mounted with `disabled: true` — the common "target ref not attached yet" pattern — registered permanently disabled bindings that never fired even after `disabled` flipped to `false`. A binding's `isEnabled` now reflects only its own `disabled` handler option and `enable()`/`disable()` calls.

### Added

- One shared DOM listener per `(target, eventType)` across all hook instances, instead of one listener per hook.
- Conflict detection across hook instances that share a target.
- `record({ signal })` accepts an `AbortSignal`; recordings also auto-cancel on unmount.
- `getModifiersFromEvent` and `getModifierSymbols` are exported from the root barrel.
- `useShortcutMap` results are stable delegating handles, safe to destructure at any point in the component lifecycle.

### Changed

- The chainable builder is a plain object factory instead of a `Proxy`.
- `ShortcutResult.onAttempt` is now a required property (it was always implemented; the type was optional).
- `bind()` chain typing returns `KeyChain<string>` instead of `KeyChain<any>`.
- Conflict detection now consults scopes. Two bindings gated onto scopes that never overlap can share a combo without being reported as conflicting, since they can never be live at the same time. Bindings that share a scope, and unscoped bindings (which are always live), still conflict as before.

## [2.3.0] - 2026-04-12

### Added

- Added `$.bind()` so you can register pre-defined shortcut strings directly.
- Added support for binding arrays of alternative combos with one handler, for example `$.bind(["mod+k", "mod+p"]).on(...)`.
- Added feature coverage for single and multi-combo `.bind()` registrations.

### Changed

- Updated the package README and generated API docs to document the new binding flow.

## [2.2.0] - 2026-03-15

### Added

- Public subpath exports for `react`, `parser`, `formatter`, and `constants`.
- Entry-point contract coverage for the new subpath exports.

### Changed

- Reframed package documentation around entrypoint architecture, API design, and measured runtime size.
- Positioned `@remcostoeten/use-shortcut/react` as the preferred React import path while keeping the root barrel for compatibility.

### Removed

- Removed the published `use-shortcut` CLI binary from the npm package to keep install size down. The scaffold/runtime source stays in-repo, but `npx @remcostoeten/use-shortcut ...` is no longer a supported published entrypoint.

## [2.1.0] - 2026-03-12

### Added

- Structured shortcut debugging with `$.onDebug()` for every evaluated keypress.
- Rich `result.onAttempt()` payloads with `matched`, `partial`, `wrong-order`, and `mismatch` states plus token-level verdicts.
- Docs demo coverage for visual debug overlays, configurable-corner toasts, and keyboard metadata output.

### Changed

- Expanded README, API docs, `llm.txt`, skill docs, and registry metadata to document the new debug flow.

## [2.0.1] - 2026-03-11

### Fixed

- Re-exported `useShortcutMap`, `registerShortcutMap`, `createShortcutGroup`, and `useShortcutGroup` from the public package entrypoint.
- Re-exported shortcut map and shortcut group types from the public package entrypoint.

### Changed

- Updated the README to document the public shortcut map API.

## [2.0.0] - 2026-03-04

### Changed

- Removed non-React public entry points (`createShortcut`, `createShortcutMap`) to focus package API on React-first usage.

## [1.3.0] - 2026-02-28

### Added

- Shortcut groups with `createShortcutGroup()` and `useShortcutGroup()` for bulk cleanup
- Priority-based ordering and `stopOnMatch` for overlapping shortcuts
- Global `eventFilter` hook option to guard shortcut handling per event

## [1.2.0] - 2026-02-28

### Added

- CLI `scaffold` command to generate a scalable React/Next shortcut architecture
- Scaffolded architecture with typed registry, scopes, provider state/actions, runtime mapping, and persistence adapter
- `init --architecture` alias for architecture scaffolding workflow
- Human architecture docs (`docs/app-architecture.md`) and LLM-focused architecture contract (`docs/app-architecture.llm.md`)
- `LLM.txt` updates covering the new architecture scaffolding model

## [1.1.0] - 2026-02-28

### Added

- Sequence/chord support with `.then()` for multi-step shortcuts (`$.key("g").then("d")`)
- Named scope/context system with `.in()` and runtime scope controls (`setScopes`, `enableScope`, `disableScope`)
- Conflict detection for exact overlaps and sequence-prefix collisions, including `mod` cross-platform normalization
- `useShortcutMap`, `createShortcutMap`, and `registerShortcutMap` bulk registration helpers
- Recording mode via `$.record()` to capture the next key combo
- Test suite using Vitest + jsdom for advanced feature coverage

## [1.0.0] - 2026-01-22

### Added

- Chainable API for fluent shortcut definitions (`$.cmd.key("s").on(handler)`)
- Cross-platform `mod` modifier (⌘ on Mac, Ctrl on Windows/Linux)
- Context-aware exceptions with `.except()` for inputs, modals, and custom predicates
- Full TypeScript intellisense at every step of the chain
- Platform-aware display formatting (⌘S on Mac, Ctrl+S on Windows)
- `useShortcut` hook for React with automatic cleanup
- `createShortcut` for non-React usage
- CLI for shadcn-style copy-paste installation
- Shortcut result object with `enable()`, `disable()`, `trigger()`, and `unbind()`
