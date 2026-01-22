# useShortcut

Chainable keyboard shortcuts for React with **perfect TypeScript intellisense**.

![Demo](./public/demo.gif)

## Features

- **Chainable API** - Fluent, readable shortcut definitions
- **Perfect TypeScript** - Intellisense at every step of the chain
- **Cross-platform** - `mod` maps to ⌘ on Mac, Ctrl on Windows/Linux
- **Context-aware** - Skip shortcuts in inputs with `.except()`
- **Zero dependencies** - Only React as peer dependency
- **Tiny footprint** - ~3KB gzipped

## Quick Start

```typescript
import { useShortcut } from "@remcostoeten/use-shortcut"

function App() {
  const $ = useShortcut()

  $.cmd.key("s").on(() => save())
  $.mod.key("k").on(() => search())
  $.key("/").except("typing").on(() => focusSearch())

  return <div>Press ⌘+S to save</div>
}
```

## Installation

### Package Manager

```bash
bun add @remcostoeten/use-shortcut
npm install @remcostoeten/use-shortcut
pnpm add @remcostoeten/use-shortcut
```

### Copy-paste (shadcn-style)

```bash
npx @remcostoeten/use-shortcut init
```

This copies the source files directly into your project at `hooks/use-shortcut/`.

## API Reference

### Modifiers

```tsx
$.ctrl.key("s")           // Ctrl+S
$.shift.key("enter")      // Shift+Enter
$.alt.key("n")            // Alt+N
$.cmd.key("k")            // ⌘+K (Mac) / Ctrl+K (Windows)
$.mod.key("k")            // Cross-platform

// Combine modifiers
$.ctrl.shift.key("p")
$.cmd.shift.alt.key("a")
```

### Exception Handling

```tsx
$.key("/").except("input").on(handler)     // Skip in <input>
$.key("/").except("typing").on(handler)    // Skip in any text input
$.key("escape").except("modal").on(handler) // Skip when modal open

// Custom
$.key("k").except((e) => e.target.classList.contains("no-shortcuts")).on(handler)
```

### Handler Options

```tsx
$.mod.key("s").on(save, {
  preventDefault: true,
  stopPropagation: false,
  delay: 100,
  description: "Save document",
})
```

### Result Object

```tsx
const save = $.mod.key("s").on(handleSave)

save.display    // "⌘S" on Mac, "Ctrl+S" on Windows
save.combo      // "cmd+s"
save.isEnabled  // true/false
save.enable()
save.disable()
save.unbind()
save.trigger()
```

## Running the Demo

```bash
bun install
bun dev
```

Visit <http://localhost:3000>

## Project Structure

```
├── src/
│   ├── app/                    # Next.js app
│   ├── core/keyboard/          # Core library
│   │   ├── use-shortcut/       # Hook implementation
│   │   ├── constants.ts        # Platform detection, key maps
│   │   ├── parser.ts           # Shortcut string parsing
│   │   └── formatter.ts        # Display formatting
│   └── features/demo/          # Demo components
├── packages/use-shortcut/      # npm package
└── README.md
```

## License

MIT © Remco Stoeten
