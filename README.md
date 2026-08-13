# use-shortcut

[![npm version](https://badge.fury.io/js/%40remcostoeten%2Fuse-shortcut.svg)](https://badge.fury.io/js/%40remcostoeten%2Fuse-shortcut)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)

Typed React keyboard shortcuts with combos, sequences, scopes, parser utilities, and shortcut recording.

**Live site**: [use-shortcut.vercel.app](https://use-shortcut.vercel.app) · **Docs**: [use-shortcut.vercel.app/use-shortcut](https://use-shortcut.vercel.app/use-shortcut) · **Shortcut Lab**: [use-shortcut.vercel.app/lab](https://use-shortcut.vercel.app/lab)

## Install

```bash
pnpm add @remcostoeten/use-shortcut
```
```bash
bun add @remcostoeten/use-shortcut
```
```bash
npm install @remcostoeten/use-shortcut
```
```bash
yarn add @remcostoeten/use-shortcut
```

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
- Built-in shortcut recording functionality (abortable via `AbortSignal`)
- One shared DOM listener per target across all hook instances

## Quick Start

```tsx
import { useShortcutBinding } from '@remcostoeten/use-shortcut/react';

function App() {
  useShortcutBinding('k', () => console.log('k pressed'));
  useShortcutBinding('mod+s', () => console.log('Ctrl/Cmd+S'));
  useShortcutBinding('g then g', () => console.log('gg pressed'));

  return <div>Your app content</div>;
}
```

## Documentation

Visit [use-shortcut.vercel.app](https://use-shortcut.vercel.app) for:

- Complete API documentation
- Interactive examples and demos
- [Shortcut Lab](https://use-shortcut.vercel.app/lab) — a command-driven editor playground for scopes, debug telemetry, chaining, and groups
- Copy-ready component recipes
- Advanced configuration options
- Shortcut recording guide

The docs site uses a dark theme by default.

## Workspace Layout

Monorepo structure for development:

- `registry`: neutral registry entry layer and shared registry types
- `packages/use-shortcut`: Core library source, tests, and package metadata
- `apps/docs`: Registry shell, package docs, demos, marketing pages, and Shortcut Lab (`/lab` in package mode, `/use-shortcut/lab` in registry mode)
- `skills/use-shortcut`: Local agent skill for this repository

## Development

Install dependencies from the workspace root:

```bash
bun install
```

Run the docs app locally (includes docs + Shortcut Lab on port 8080):

```bash
bun run docs:dev
```

Open:

- Docs home: `http://localhost:8080/` (package mode) or `http://localhost:8080/use-shortcut` (registry mode)
- Shortcut Lab: `http://localhost:8080/lab` (package mode) or `http://localhost:8080/use-shortcut/lab` (registry mode)

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
