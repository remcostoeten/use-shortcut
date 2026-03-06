# AI implementation prompt

Implement `@remcostoeten/use-shortcut` in this project.

Requirements:
- Use React and TypeScript.
- Import `useShortcut` from `@remcostoeten/use-shortcut`.
- Default to `ignoreInputs: true` unless there is a clear product reason not to.
- Add global app shortcuts in the app shell, layout, or top-level provider.
- Use `preventDefault: true` for browser-conflicting shortcuts like `mod+s` and `mod+k`.
- Represent help as `shift+slash`, not `?`.
- Use `.except("typing")` for shortcuts that should not fire inside editable fields.
- Prefer scopes for context-specific shortcuts instead of ad hoc conditional logic.
- Keep the implementation accessible with visible focus styles and native button/link semantics.

Implement at least these shortcuts:
- `mod+k` opens command palette
- `mod+shift+p` opens project search
- `shift+slash` opens help
- `escape` closes the currently open overlay when appropriate

Deliver:
- The shortcut registration code
- Any provider, hook, or shell integration needed
- One small UI example showing the shortcut hints
- Comments only where necessary

Nice to have:
- A settings screen that captures a user-defined shortcut with `$.record()`
- A small helper that formats display labels with `formatShortcut()`

Reference docs:
- `https://use-shortcut.vercel.app/llm.txt`
- `https://use-shortcut.vercel.app/agents.md`
