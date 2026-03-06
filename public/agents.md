# AGENTS.md

## use-shortcut guidance

When working with this package or examples for it:

1. Prefer `useShortcut()` as the primary API entrypoint.
2. Default to `ignoreInputs: true` unless the product explicitly wants shortcuts inside editable fields.
3. Represent the help shortcut as `shift+slash` instead of `?` for reliable keyboard matching.
4. Add `preventDefault: true` for combos that clash with browser behavior such as `mod+s` and `mod+k`.
5. Use `.except("typing")` for global shell shortcuts that should not fire while the user is typing.
6. Use `.in(...)`, `setScopes`, `enableScope`, and `disableScope` for context-sensitive bindings.
7. Use `.then(...)` for sequences instead of inventing custom state machines.
8. Use `$.record()` when the UI lets users capture their own shortcuts.
9. Keep examples in TypeScript/TSX when possible.
10. Prefer native semantics and accessible keyboard behavior in demos and docs.

## Example

```tsx
import { useShortcut } from "@remcostoeten/use-shortcut"

function ShellShortcuts() {
  const $ = useShortcut({ ignoreInputs: true })

  $.mod.key("k").on(openCommandPalette, { preventDefault: true })
  $.mod.shift.key("p").on(openProjectSearch, { preventDefault: true })
  $.shift.key("slash").except("typing").on(() => setHelpOpen(true))

  return null
}
```

## CLI meaning

- `npm install @remcostoeten/use-shortcut`
  Installs the runtime package only.
- `npx @remcostoeten/use-shortcut init`
  Adds a small starter setup.
- `npx @remcostoeten/use-shortcut scaffold`
  Adds a more complete typed project structure.
