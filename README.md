# use-shortcut + registry workspace

[![npm version](https://badge.fury.io/js/%40remcostoeten%2Fuse-shortcut.svg)](https://badge.fury.io/js/%40remcostoeten%2Fuse-shortcut)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)

Typed React keyboard shortcuts with combos, sequences, scopes, parser utilities, and shortcut recording, plus a registry/docs app for publishing tools on shared or dedicated domains.

**Live Demo**: [use-shortcut.vercel.app](https://use-shortcut.vercel.app)

**Documentation**: [use-shortcut.vercel.app/use-shortcut](https://use-shortcut.vercel.app/use-shortcut)

## Registry Direction

This repository is evolving into a personal tool registry:

- a base registry site for all public tools
- a reusable registry framework driven by per-entry config
- optional dedicated domains per tool such as `use-shortcut.remcostoeten.nl`
- entry pages that can showcase npm packages, CLIs, VS Code extensions, and helper files such as `skills.sh` or `agents.md`

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
import { useEffect } from 'react';
import { useShortcut } from '@remcostoeten/use-shortcut/react';

function App() {
  const $ = useShortcut();

  useEffect(() => {
    const shortcuts = [
      $.key('k').on(() => console.log('k pressed')),
      $.mod.key('s').on(() => console.log('Ctrl/Cmd+S')),
      $.key('g').then('g').on(() => console.log('gg pressed')),
    ];

    return () => shortcuts.forEach((shortcut) => shortcut.unbind());
  }, [$]);

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

- `registry`: neutral registry entry layer and shared registry types
- `packages/use-shortcut`: Core library source, tests, and package metadata
- `apps/docs`: Registry shell plus entry-specific docs, demos, and marketing pages
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
