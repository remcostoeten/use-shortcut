# use-shortcut

[![npm version](https://badge.fury.io/js/%40remcostoeten%2Fuse-shortcut.svg)](https://badge.fury.io/js/%40remcostoeten%2Fuse-shortcut)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)

Typed React keyboard shortcuts with combos, sequences, scopes, parser utilities, and shortcut recording.

**Live Demo**: [use-shortcut.vercel.app](https://use-shortcut.vercel.app)

**Documentation**: [use-shortcut.vercel.app/use-shortcut](https://use-shortcut.vercel.app/use-shortcut)

## Features

- Type-safe with full TypeScript support and autocompletion
- Lightweight with tiny bundle size and zero dependencies
- Support for combos and sequences with complex shortcut patterns
- Context-aware shortcut management with scopes
- Parser utilities to parse and validate shortcut strings
- Built-in shortcut recording functionality
- ARIA-compliant and keyboard-friendly

## Quick Start

## Installation Commands

```bash
pnpm add @remcostoeten/use-shortcut
bun add @remcostoeten/use-shortcut
// or npm....
```
```tsx
import { useShortcut } from '@remcostoeten/use-shortcut';

function App() {
  const $ = useShortcut();

  // Simple shortcut
  $.key('k').on(() => console.log('k pressed'));

  // Combo shortcut
  $.mod.key('s').on(() => console.log('Ctrl/Cmd+S'));

  // Sequence shortcut
  $.seq('g', 'g').on(() => console.log('gg pressed'));

  return <div>Your app content</div>;
}
```

## Documentation

Visit [use-shortcut.vercel.app](https://use-shortcut.vercel.app) for:
- Complete API documentation
- Interactive examples and demos
- Copy-ready component recipes
- Advanced configuration options
- Shortcut recording guide

## Workspace Layout

Monorepo structure for development:

- `packages/use-shortcut`: Core library source, tests, and package metadata
- `apps/docs`: Documentation, demos, examples, and marketing site
- `skills/use-shortcut`: Local agent skill for this repository

## Development

Install dependencies from the workspace root:

```bash
bun install
```

Run docs app locally:

```bash
bun run docs:dev
```

Build and test the package:

```bash
bun run package:build
bun run package:test
bun run package:typecheck
```

Run workspace-wide checks:

```bash
bun run build
bun run lint
bun run test
```

MIT 
