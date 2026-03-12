# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
