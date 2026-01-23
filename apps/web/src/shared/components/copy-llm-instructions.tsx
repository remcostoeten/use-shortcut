"use client"

import { useState } from "react"

const LLM_INSTRUCTION = `# @remcostoeten/use-shortcut

A chainable, fully typed keyboard shortcut library for React with exhaustive TypeScript intellisense.

## Installation

\`\`\`bash
npm install @remcostoeten/use-shortcut
# or
pnpm add @remcostoeten/use-shortcut
# or
bun add @remcostoeten/use-shortcut
\`\`\`

## Import

\`\`\`tsx
import { useShortcut } from "@remcostoeten/use-shortcut"

// Additional exports
import {
  createShortcut,        // Non-hook version (manual cleanup)
  parseShortcut,         // Parse "ctrl+s" into structured object
  parseShortcuts,        // Parse multiple shortcut strings
  formatShortcut,        // Format shortcut for display
  getModifierSymbols,    // Get platform modifier symbols
  matchesShortcut,       // Check if event matches a parsed shortcut
  matchesAnyShortcut,    // Check if event matches any in array
  getModifiersFromEvent, // Extract modifier state from KeyboardEvent
  detectPlatform,        // Detect current platform
} from "@remcostoeten/use-shortcut"

// Type imports
import type {
  UseShortcutOptions,
  ShortcutResult,
  ShortcutHandler,
  HandlerOptions,
  ShortcutBuilder,
  ActionKey,
  ModifierName,
  AlphaKey,
  NumericKey,
  FunctionKey,
  NavigationKey,
  SpecialKey,
  SymbolKey,
  ExceptPreset,
  ExceptPredicate,
  ParsedShortcut,
  ModifierState,
} from "@remcostoeten/use-shortcut"
\`\`\`

## Quick Start

\`\`\`tsx
"use client"

import { useShortcut } from "@remcostoeten/use-shortcut"

export function MyComponent() {
  const $ = useShortcut()

  // Platform-aware: Cmd+S on Mac, Ctrl+S on Windows/Linux
  const save = $.mod.key("s").on(() => console.log("Save"))

  // Display: "⌘S" on Mac, "Ctrl+S" on Windows
  return <span>{save.display}</span>
}
\`\`\`

## Hook Options (\`UseShortcutOptions\`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`debug\` | \`boolean\` | \`false\` | Log key presses and matches to console |
| \`delay\` | \`number\` | \`0\` | Global debounce delay in ms |
| \`ignoreInputs\` | \`boolean\` | \`true\` | Skip shortcuts in input/textarea/select |
| \`target\` | \`HTMLElement \\| Window \\| null\` | \`window\` | Event listener target |
| \`eventType\` | \`"keydown" \\| "keyup"\` | \`"keydown"\` | Which keyboard event to listen for |
| \`disabled\` | \`boolean\` | \`false\` | Disable all shortcuts globally |

\`\`\`tsx
const $ = useShortcut({
  debug: true,
  delay: 100,
  ignoreInputs: false,
  eventType: "keyup",
  disabled: someCondition,
})
\`\`\`

## Builder API (Chainable Modifiers)

| Modifier | Description |
|----------|-------------|
| \`.ctrl\` | Control key |
| \`.shift\` | Shift key |
| \`.alt\` | Alt/Option key |
| \`.cmd\` | Command (Mac) / Windows key |
| \`.mod\` | Platform-aware: Cmd on Mac, Ctrl on Windows/Linux |

Modifiers are chainable and each can only be used once per combination (enforced by TypeScript):

\`\`\`tsx
$.ctrl.key("c")              // Ctrl+C
$.mod.key("s")               // Cmd+S (Mac) / Ctrl+S (Win)
$.ctrl.shift.key("p")        // Ctrl+Shift+P
$.ctrl.alt.shift.key("d")    // Ctrl+Alt+Shift+D
$.mod.shift.key("z")         // Cmd+Shift+Z (Mac) / Ctrl+Shift+Z (Win)
\`\`\`

## Action Keys (\`ActionKey\`)

### Letters
\`"a"\` through \`"z"\`

### Numbers
\`"0"\` through \`"9"\`

### Function Keys
\`"f1"\` through \`"f12"\`

### Navigation Keys
\`"up"\` | \`"down"\` | \`"left"\` | \`"right"\` | \`"arrowup"\` | \`"arrowdown"\` | \`"arrowleft"\` | \`"arrowright"\` | \`"home"\` | \`"end"\` | \`"pageup"\` | \`"pagedown"\`

### Special Keys
\`"enter"\` | \`"return"\` | \`"escape"\` | \`"esc"\` | \`"space"\` | \`"tab"\` | \`"backspace"\` | \`"delete"\` | \`"del"\` | \`"insert"\`

### Symbol Keys
\`"minus"\` | \`"plus"\` | \`"equal"\` | \`"equals"\` | \`"bracketleft"\` | \`"bracketright"\` | \`"backslash"\` | \`"slash"\` | \`"/"\` | \`"comma"\` | \`"period"\` | \`"semicolon"\` | \`"quote"\` | \`"backtick"\`

## Handler Registration

### \`.on(handler, options?)\`

\`\`\`tsx
const result = $.mod.key("s").on((event) => {
  save()
}, {
  preventDefault: true,       // default: true
  stopPropagation: false,     // default: false
  delay: 200,                 // handler-specific debounce
  description: "Save file",   // for debugging
  disabled: false,            // disable this shortcut
  scope: containerRef.current, // limit to DOM element
  except: "typing",           // exception condition
})
\`\`\`

### \`.handle(options)\`

Alternative to \`.on()\` with handler in options object:

\`\`\`tsx
const result = $.mod.key("s").handle({
  handler: (e) => save(),
  preventDefault: true,
  description: "Save file",
})
\`\`\`

## Handler Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`preventDefault\` | \`boolean\` | \`true\` | Prevent default browser action |
| \`stopPropagation\` | \`boolean\` | \`false\` | Stop event bubbling |
| \`delay\` | \`number\` | \`0\` | Handler-specific debounce delay in ms |
| \`description\` | \`string\` | - | Description for debugging/docs |
| \`disabled\` | \`boolean\` | \`false\` | Disable this specific shortcut |
| \`scope\` | \`HTMLElement \\| null\` | - | Limit shortcut to specific DOM element |
| \`except\` | \`ExceptPreset \\| ExceptPreset[] \\| ExceptPredicate\` | - | Conditions to skip handler |

## Exception Handling (\`.except()\`)

### Presets

| Preset | Description |
|--------|-------------|
| \`"input"\` | Skip when focused on \`<input>\`, \`<textarea>\`, \`<select>\` |
| \`"editable"\` | Skip when focused on \`contentEditable\` elements |
| \`"typing"\` | Combines \`"input"\` + \`"editable"\` |
| \`"modal"\` | Skip when a modal/dialog is open (checks \`[data-modal]\` or \`[role="dialog"]\`) |
| \`"disabled"\` | Skip when the focused element is disabled |

### Usage

\`\`\`tsx
// Single preset
$.key("/").except("typing").on(openSearch)

// Multiple presets
$.mod.key("k").except(["typing", "modal"]).on(openPalette)

// Custom predicate
$.key("escape").except((event) => {
  return document.querySelector(".dropdown-open") !== null
}).on(closeAll)

// Clear all exceptions (enable in inputs)
$.mod.key("s").except([]).on(save)
\`\`\`

## Result Object (\`ShortcutResult\`)

| Property/Method | Type | Description |
|-----------------|------|-------------|
| \`display\` | \`string\` | Platform-formatted display string (\`"⌘S"\` or \`"Ctrl+S"\`) |
| \`combo\` | \`string\` | Normalized combo string (\`"cmd+s"\`) |
| \`isEnabled\` | \`boolean\` | Current enabled state |
| \`unbind()\` | \`() => void\` | Remove the event listener |
| \`trigger()\` | \`() => void\` | Programmatically trigger the handler |
| \`enable()\` | \`() => void\` | Re-enable after disable |
| \`disable()\` | \`() => void\` | Temporarily disable |

\`\`\`tsx
const save = $.mod.key("s").on(handleSave)

// Use in JSX
<kbd>{save.display}</kbd>           // "⌘S" on Mac, "Ctrl+S" on Win

// Programmatic control
save.disable()                       // Temporarily disable
save.enable()                        // Re-enable
save.trigger()                       // Fire handler manually
save.unbind()                        // Remove completely
console.log(save.combo)              // "mod+s"
console.log(save.isEnabled)          // true/false
\`\`\`

## Platform Display Formatting

| Platform | Modifiers | Separator | Example |
|----------|-----------|-----------|---------|
| Mac | Symbols: ⌘ ⌃ ⌥ ⇧ | None | \`⌘⇧S\` |
| Windows/Linux | Text: Ctrl, Alt, Shift | \`+\` | \`Ctrl+Shift+S\` |

## Complete Examples

### Global Save with Input Override

\`\`\`tsx
const $ = useShortcut()
const save = $.mod.key("s").except([]).on((e) => {
  e.preventDefault()
  saveDocument()
})
\`\`\`

### Scoped to a Container

\`\`\`tsx
const containerRef = useRef<HTMLDivElement>(null)
const $ = useShortcut()

$.key("escape").on(() => close(), {
  scope: containerRef.current,
})
\`\`\`

### Command Palette with Multiple Modifiers

\`\`\`tsx
const $ = useShortcut()
const palette = $.ctrl.shift.key("p").on(toggleCommandPalette)

// Display the shortcut hint
<button>
  Command Palette <kbd>{palette.display}</kbd>
</button>
\`\`\`

### Navigation Shortcuts

\`\`\`tsx
const $ = useShortcut()
$.key("arrowup").except("typing").on(() => selectPrev())
$.key("arrowdown").except("typing").on(() => selectNext())
$.key("enter").except("typing").on(() => confirmSelection())
$.key("escape").on(() => clearSelection())
\`\`\`

### Non-Hook Usage (\`createShortcut\`)

\`\`\`tsx
import { createShortcut } from "@remcostoeten/use-shortcut"

// For non-React or manual lifecycle management
const $ = createShortcut()
const result = $.mod.key("s").on(save)

// Must manually unbind when done
result.unbind()
\`\`\`

### Debug Mode

\`\`\`tsx
const $ = useShortcut({ debug: true })
// Console logs all key presses and shortcut matches
$.mod.key("s").on(save)
\`\`\`

## Type Safety

TypeScript prevents invalid modifier combinations at compile time:

\`\`\`tsx
$.ctrl.ctrl.key("s")     // ERROR: ctrl already used
$.cmd.mod.key("s")       // ERROR: cmd and mod are mutually exclusive
$.ctrl.shift.alt.key("x") // OK: all different modifiers
\`\`\`
`

type FormatId = "cursorrules" | "claude" | "agents" | "copilot"

const formats: { id: FormatId; label: string; filename: string }[] = [
  { id: "cursorrules", label: ".cursorrules", filename: ".cursorrules" },
  { id: "claude", label: "claude.md", filename: "claude.md" },
  { id: "agents", label: "agents.md", filename: "agents.md" },
  { id: "copilot", label: "copilot-instructions.md", filename: ".github/copilot-instructions.md" },
]


const SETUP_PROMPT = `I need you to set up the \`@remcostoeten/use-shortcut\` package in this project.

**About the package:**
It is a chainable, fully typed keyboard shortcut library for React.

**Key Capabilities:**
- **Chainable API:** \`$.mod.shift.key("s")\`
- **Platform Aware:** \`.mod\` maps to Cmd (Mac) or Ctrl (Win/Linux) automatically
- **Scopes:** Attach to specific DOM elements
- **Conditions:** \`.except("typing")\` to skip inputs
- **Visuals:** Returns \`.display\` (e.g., "⌘S") for UI hints

**Available Modifiers:**
- \`mod\` (Super/Meta)
- \`ctrl\`
- \`alt\`
- \`shift\`
- \`cmd\`

**Configuration Options:**
| Option | Default | Description |
|--------|---------|-------------|
| \`debug\` | \`false\` | Logs keys to console |
| \`delay\` | \`0\` | Debounce delay (ms) |
| \`ignoreInputs\` | \`true\` | Skip in inputs/textareas |
| \`disabled\` | \`false\` | Globally disable shortcuts |
| \`eventType\` | \`"keydown"\` | "keydown" or "keyup" |

**Please follow these steps exactly:**

1. **Analyze Project Structure:**
   - Detect if a \`src\` directory exists. If it does, use \`src/components\` and \`src/app\`. Otherwise, use \`components\` and \`app\` in the root.
   - Detect the package manager (bun, pnpm, yarn, or npm) by looking for lockfiles.
   - Check \`package.json\` to see if \`tailwindcss\` is installed.

2. **Install Package:**
   - Echo "📦 Installing @remcostoeten/use-shortcut..."
   - Install using the detected package manager.

3. **Create Demo Component:**
   - Create \`use-shortcut-example.tsx\` in the components directory.
   - Echo "📝 Creating example component..."
   - **Important:** If Tailwind is NOT present, use inline styles.
   
   **Component Code:**
   \`\`\`tsx
   "use client"
   
   import { useShortcut } from "@remcostoeten/use-shortcut"
   import { useState } from "react"
   
   export function UseShortcutExample() {
     const [lastShortcut, setLastShortcut] = useState<string | null>(null)
     const $ = useShortcut()
   
     function flash(name: string, display: string) {
       setLastShortcut(\`\${name} → \${display}\`)
       setTimeout(() => setLastShortcut(null), 1500)
     }
   
     // Example 1: Platform aware save (Cmd+S / Ctrl+S)
     const save = $.mod.key("s").on(() => flash("Save", save.display))
     
     // Example 2: Complex modifier
     const palette = $.ctrl.shift.key("p").on(() => flash("Palette", palette.display))
   
     return (
       <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-100 font-sans">
         {lastShortcut && (
           <div className="animate-pulse mb-4 rounded-lg bg-cyan-500/20 px-4 py-2 text-cyan-400">
             {lastShortcut}
           </div>
         )}
         
         <div className="flex gap-4 text-sm text-zinc-500">
           <span className="bg-zinc-800 px-2 py-1 rounded text-zinc-300">{save.display}</span> Save
           <span className="bg-zinc-800 px-2 py-1 rounded text-zinc-300">{palette.display}</span> Palette
         </div>
       </div>
     )
   }
   \`\`\`

4. **Create Demo Page:**
   - Create \`use-shortcut-example/page.tsx\` in the app directory.
   
   **Page Code:**
   \`\`\`tsx
   import { UseShortcutExample } from "@/components/use-shortcut-example"
   
   export default function UseShortcutExamplePage() {
     return (
       <main style={{ minHeight: "100vh", padding: "3rem", backgroundColor: "#09090b", color: "#f4f4f5" }}>
         <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "2rem" }}>useShortcut Demo</h1>
         <UseShortcutExample />
       </main>
     )
   }
   \`\`\`

5. **Completion:**
   - Echo "✅ Installation complete! Visit /use-shortcut-example"`

export function CopyLlmInstructions() {
  const [copied, setCopied] = useState<string | null>(null)

  async function handleCopy(text: string, id: string) {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-zinc-300">Package Specification</h3>
        <p className="text-sm text-zinc-400">
          Copy the full package spec for your AI coding assistant. Paste into the respective file.
        </p>
        <div className="flex flex-wrap gap-2">
          {formats.map((f) => (
            <button
              key={f.id}
              onClick={() => handleCopy(LLM_INSTRUCTION, f.id)}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm font-mono text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              <span>{f.label}</span>
              {copied === f.id ? (
                <svg className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-600">
          All formats contain the same spec content.
        </p>
      </div>

      <div className="space-y-3 border-t border-zinc-800 pt-6">
        <h3 className="text-sm font-medium text-zinc-300">Agent Setup Prompt</h3>
        <p className="text-sm text-zinc-400">
          One-shot prompt to have an AI agent install the package and set up a demo component.
        </p>
        <button
          onClick={() => handleCopy(SETUP_PROMPT, "setup")}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-700 hover:text-white"
        >
          <span>Copy Setup Prompt</span>
          {copied === "setup" ? (
            <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
