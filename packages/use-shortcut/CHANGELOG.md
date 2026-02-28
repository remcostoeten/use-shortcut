# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
