---
name: use-shortcut
description: React hook for typed keyboard shortcuts - use when adding keyboard shortcuts to a React app
---

# use-shortcut

A chainable, type-safe keyboard shortcuts hook for React (~3kb, zero dependencies).

## When to Use

Use this skill when the user wants to:
- Add keyboard shortcuts to a React application
- Create keyboard-driven interfaces (command palettes, keyboard navigation)
- Build accessible apps with keyboard support
- Handle complex shortcut combinations (chords, sequences)

## Installation

```bash
npm install @remcostoeten/use-shortcut
```

Optional CLI tools:
```bash
npx @remcostoeten/use-shortcut init   # Copy starter files
npx @remcostoeten/use-shortcut scaffold  # Generate full typed architecture
```

## Quick Start

```tsx
import { useShortcut } from "@remcostoeten/use-shortcut"

function App() {
  const $ = useShortcut()

  $.mod.key("s").on(() => save(), { preventDefault: true })
  $.key("escape").on(() => close())

  return <div>Press Cmd+S or Esc</div>
}
```

## Chainable API

The hook returns a chainable builder (`$`) for building shortcuts:

### Modifiers
- `$.cmd` - Command key (mac)
- `$.ctrl` - Control key
- `$.mod` - Platform-aware: Cmd on mac, Ctrl on Windows/Linux
- `$.shift` - Shift key
- `$.alt` - Alt/Option key

### Keys
- `$.key("a")` - Letter keys
- `$.key("1")` - Number keys
- `$.key("escape")` - Special keys (escape, enter, tab, space, etc.)
- `$.key("/")` - Symbol keys
- `$.key("arrowup")` - Navigation keys

### Combining Modifiers + Keys
```tsx
$.mod.key("k").on(() => openPalette())      // Cmd+K / Ctrl+K
$.mod.shift.key("p").on(() => openPrefs())  // Cmd+Shift+P
$.ctrl.alt.key("d").on(() => toggleDebug()) // Ctrl+Alt+D
```

## Sequences & Chords

Multi-step shortcuts like GitHub's "g then d" for dashboard:

```tsx
// Press g, then d
$.key("g").then("d").on(() => goToDashboard())

// Steps can include modifiers
$.key("g").then("shift+d").on(() => openDebug())
```

## Named Scopes

Different shortcuts for different UI contexts (editor vs navigation):

```tsx
const $ = useShortcut({ activeScopes: "navigation" })

// Only active in "navigation" scope
$.in("navigation").key("j").on(() => nextItem())
$.in("navigation").key("k").on(() => prevItem())

// Only active in "editor" scope
$.in("editor").mod.key("s").on(() => saveFile())

// Switch scopes at runtime
$.setScopes("editor")
$.enableScope("navigation")
$.disableScope("editor")
```

## Except Conditions

Skip shortcuts in specific contexts:

```tsx
// Don't trigger / when typing in inputs
$.key("/").except("typing").on(() => focusSearch())

// Common presets: "input", "editable", "typing", "modal", "disabled"
$.mod.key("k").except(["input", "modal"]).on(() => openPalette())
```

## Options

### Hook Options (useShortcut)
```tsx
const $ = useShortcut({
  debug: {
    console: true,
    includeCode: true,
    includeLocation: true,
    includeKeyCode: true,
  },                        // Rich debug output
  ignoreInputs: true,       // Skip shortcuts in input/textarea/select
  target: containerRef,     // Attach to specific element
  eventType: "keydown",     // "keydown" or "keyup"
  disabled: false,          // Disable all shortcuts
  activeScopes: ["editor"], // Initial active scopes
  sequenceTimeout: 800,    // Max ms for sequence completion
  conflictWarnings: true,  // Warn on shortcut conflicts
})
```

### Debug Hooks
```tsx
const removeDebug = $.onDebug((event) => {
  console.log(event.input.combo, event.input.code, event.attempts)
})

const result = $.shift.key("e").then("e").on(runProbe)

const removeAttempt = result.onAttempt?.((matched, _event, details) => {
  console.log(matched ? "matched" : details?.status, details?.steps)
})
```

### Handler Options (.on)
```tsx
$.mod.key("s").on(handler, {
  preventDefault: true,
  stopPropagation: false,
  delay: 0,
  description: "save document",
  disabled: false,
  except: "typing",
  scopes: ["editor"],
  priority: 10,
})
```

## Utility Functions

### formatShortcut
Format shortcuts for UI display (platform-aware):
```tsx
import { formatShortcut } from "@remcostoeten/use-shortcut"

formatShortcut("mod+s") // "⌘S" on mac, "Ctrl+S" on Windows
```

### parseShortcut / parseShortcuts
Parse shortcut strings for custom matching:
```tsx
import { parseShortcut, parseShortcuts } from "@remcostoeten/use-shortcut"

parseShortcut("mod+shift+p")
// { modifiers: { meta: true, shift: true }, key: "p" }

parseShortcuts(["mod+s", "escape"])
```

### matchesShortcut / matchesAnyShortcut
Match keyboard events against parsed shortcuts:
```tsx
import { matchesAnyShortcut, parseShortcuts } from "@remcostoeten/use-shortcut"

const shortcuts = parseShortcuts(["mod+k", "escape"])

window.addEventListener("keydown", (event) => {
  if (matchesAnyShortcut(event, shortcuts)) {
    // Handle shortcut
  }
})
```

## Recording Shortcuts

Capture user keyboard input for settings pages:
```tsx
async function recordShortcut() {
  const combo = await $.record({ timeoutMs: 5000 })
  // combo = "shift+slash"
  saveUserShortcut(combo)
}
```

## Return Value

The `.on()` method returns a `ShortcutResult` handle:
```tsx
const saveResult = $.mod.key("s").on(save)

saveResult.display   // "⌘S" (human-readable)
saveResult.combo     // "mod+s" (normalized)
saveResult.unbind()  // Remove the shortcut
saveResult.disable() // Temporarily disable
saveResult.enable()  // Re-enable
saveResult.trigger() // Programmatically trigger
```

## Common Patterns

### Command Palette
```tsx
$.mod.key("k").on(() => setOpen(true), { preventDefault: true })
$.key("escape").except("typing").on(() => setOpen(false))
```

### Save Shortcut
```tsx
$.mod.key("s").on(save, { preventDefault: true, scopes: ["editor"] })
```

### Escape Hatch
```tsx
$.key("escape").on(closeModal)
$.key("escape").except("typing").on(clearSelection)
```

### Global Help
```tsx
$.key("shift+/").except("typing").on(() => toggleHelp())
```

## TypeScript

The package provides full type inference. Types are available for advanced usage:
- `ShortcutBuilder` - The chain builder type
- `ShortcutResult` - Return value from `.on()`
- `UseShortcutOptions` - Hook options
- `HandlerOptions` - Handler options
- `ParsedShortcut` - Parser output shape
