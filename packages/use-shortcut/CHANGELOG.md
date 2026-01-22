# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
