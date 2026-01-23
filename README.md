# useShortcut

Chainable keyboard shortcuts for React with perfect TypeScript intellisense.

- **GitHub**: <https://github.com/remcostoeten/use-shortcut>
- **NPM**: <https://www.npmjs.com/package/@remcostoeten/use-shortcut>
- **Version**: v1.0.0

## Installation

```bash
npm install @remcostoeten/use-shortcut
# or
pnpm add @remcostoeten/use-shortcut
# or
bun add @remcostoeten/use-shortcut
```

## Agent Setup

Copy this prompt and paste it to your AI agent (Cursor, Windsurf, v0, etc.) to automatically set up the package and a demo.

```markdown
I need you to set up the `@remcostoeten/use-shortcut` package in this project.

**About the package:**
It is a chainable, fully typed keyboard shortcut library for React that supports complex modifiers and conditional execution.

**Please follow these steps exactly:**

1. **Analyze Project Structure:**
   - Detect if a `src` directory exists. If it does, use `src/components` and `src/app`. Otherwise, use `components` and `app` in the root.
   - Detect the package manager (bun, pnpm, yarn, or npm) by looking for lockfiles.
   - Check `package.json` to see if `tailwindcss` is installed.

2. **Install Package:**
   - Echo "📦 Installing @remcostoeten/use-shortcut..."
   - Install using the detected package manager.

3. **Create Demo Component:**
   - Create `use-shortcut-example.tsx` in the components directory.
   - Echo "📝 Creating example component..."
   - **Important:** If Tailwind is NOT present, convert the Tailwind classes in the code below to standard inline `style={{ ... }}` attributes (e.g., `p-8` -> `padding: "2rem"`, `bg-zinc-900` -> `backgroundColor: "#18181b"`).

   **Component Code:**
   ```tsx
   "use client"

   import { useShortcut } from "@remcostoeten/use-shortcut"
   import { useState } from "react"

   export function UseShortcutExample() {
     const [lastShortcut, setLastShortcut] = useState<string | null>(null)
     const $ = useShortcut()

     function flash(name: string, display: string) {
       setLastShortcut(`${name} → ${display}`)
       setTimeout(() => setLastShortcut(null), 1500)
     }

     const save = $.mod.key("s").on(() => flash("Save", save.display))
     const search = $.mod.key("k").on(() => flash("Search", search.display))
     const undo = $.mod.key("z").on(() => flash("Undo", undo.display))
     const palette = $.ctrl.shift.key("p").on(() => flash("Command Palette", palette.display))

     return (
       <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-100 font-sans">
         {lastShortcut && (
           <div className="animate-pulse mb-4 rounded-lg bg-cyan-500/20 px-4 py-2 text-cyan-400">
             {lastShortcut}
           </div>
         )}

         <div className="flex gap-4 text-sm text-zinc-500">
           <span className="bg-zinc-800 px-2 py-1 rounded text-zinc-300">{save.display}</span> Save
           <span className="bg-zinc-800 px-2 py-1 rounded text-zinc-300">{search.display}</span> Search
           <span className="bg-zinc-800 px-2 py-1 rounded text-zinc-300">{undo.display}</span> Undo
         </div>
       </div>
     )
   }
   ```

1. **Create Demo Page:**
   - Create `use-shortcut-example/page.tsx` in the app directory.
   - Echo "📄 Creating demo page..."

   **Page Code:**

   ```tsx
   import { UseShortcutExample } from "@/components/use-shortcut-example" // Adjust import path if needed

   export default function UseShortcutExamplePage() {
     return (
       <main style={{ minHeight: "100vh", padding: "3rem", backgroundColor: "#09090b", color: "#f4f4f5" }}>
         <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "2rem" }}>useShortcut Demo</h1>
         <UseShortcutExample />
       </main>
     )
   }
   ```

2. **Completion:**
   - Echo "✅ Installation complete! Visit /use-shortcut-example to try it out."

```

## Builder API

The chainable methods available on the shortcut builder.

| Method | Description | Example |
|--------|-------------|---------|
| `mod` | Standard modifier. ⌘ on Mac, Ctrl on Windows/Linux. | `shortcut.mod.key("s")` |
| `ctrl` | Control key. | `shortcut.ctrl.key("c")` |
| `shift` | Shift key. | `shortcut.shift.key("enter")` |
| `alt` | Alt/Option key. | `shortcut.alt.key("n")` |
| `cmd` | Command key (Mac) or Windows key (Windows). | `shortcut.cmd.key("k")` |
| `key(char)` | Specifies the action key. Must be the last step before handlers. | `.key("s")` |
| `except(condition)` | Condition to skip the shortcut. Presets: `"input"` \| `"typing"` \| `"modal"` | `.except("typing")` |
| `on(handler)` | Registers the event listener. Returns a result object to control it. | `.on(saveFile)` |

## Hook Options

Configuration object passed to `useShortcut(options)`.

| Option | Default | Description |
|--------|---------|-------------|
| `ignoreInputs` | `true` | If true, shortcuts won't trigger in `input/textarea/select`. |
| `debug` | `false` | Logs key presses and shortcut matches to console. |
| `delay` | `0` | Debounce delay in milliseconds before triggering handler. |
| `blockedByModal` | `false` | If true, prevents shortcuts when a modal is open. |

## Examples

### Basic Usage

```typescript
import { useShortcut } from "@remcostoeten/use-shortcut"

export function App() {
  const hotkeys = useShortcut()

  // Simple modifier + key
  hotkeys.mod.key("s").on(save)

  // Multiple modifiers
  hotkeys.ctrl.shift.key("p").on(togglePalette)
}
```

### Inside Inputs (Exception Handling)

By default, shortcuts are disabled in inputs. To enable them (e.g. for a global Save command), clear the exceptions with `.except([])`.

```typescript
// Enable inside inputs/textareas
hotkeys.mod.key("s")
  .except([])
  .on((e) => {
    e.preventDefault()
    save()
  })
```

### React State Integration

Handlers have access to the latest state and props (no stale closures).

```typescript
const [count, setCount] = useState(0)
const hotkeys = useShortcut()

hotkeys.key("arrowup").on(() => {
  // Safe to use current 'count' state
  setCount(count + 1)
})
```
