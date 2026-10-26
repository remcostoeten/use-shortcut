<h1 align="center">use-shortcut</h1>

<p align="center">Keyboard shortcuts for React and plain JavaScript, typed so that autocomplete only offers what is valid next.</p>

<p align="center">
  <img src="https://shieldcn.dev/static/typescript-6-black.svg?font=jetbrains-mono" alt="TypeScript 6" />
  <img src="https://shieldcn.dev/github/remcostoeten/use-shortcut/ci.svg?font=jetbrains-mono&workflow=ci.yml&branch=v3" alt="CI" />
  <img src="https://shieldcn.dev/static/react-18%20and%2019-black.svg?font=jetbrains-mono" alt="React 18 and 19" />
  <img src="https://shieldcn.dev/static/dependencies-none-black.svg?font=jetbrains-mono" alt="no runtime dependencies" />
  <img src="https://shieldcn.dev/static/runtime-browser%20and%20tauri-black.svg?font=jetbrains-mono" alt="runs in browsers and Tauri 2" />
</p>

One definition per app, then one line per shortcut. The handler you pass on the latest render is the one that runs, and the binding goes away when the component unmounts.

```tsx
import { createShortcuts } from "@remcostoeten/use-shortcut/react"

export const { shortcut, ShortcutProvider } = createShortcuts()

function App() {
    return (
        <ShortcutProvider>
            <Palette />
        </ShortcutProvider>
    )
}

function Palette() {
    const [open, setOpen] = useState(false)
    const handle = shortcut.mod.key("k").on(() => setOpen(true))
    return <kbd>{handle.display}</kbd>
}
```

`mod` is Cmd on a Mac and Ctrl elsewhere, and `handle.display` shows `⌘K` or `Ctrl+K` to match.

- **Combos, sequences, holds and waits** from one chain: `shortcut.key("g").then.key("d")`, `shortcut.hold("space")`, `shortcut.key("a").then.wait(300).key("b")`.
- **Autocomplete does the guarding**: after `mod` the list no longer offers `ctrl` or `meta`, `wait` must be followed by a key, and `handle.combo` is the literal type `"mod+k"`.
- **Text inputs are skipped** unless a binding says `.allowInInputs()`; `.except("modal")` and `.except("disabled")` cover the other usual cases.
- **Scopes switch groups on and off** at runtime, and `web` and `desktop` are built in, so a Tauri app can use `mod+n` where a browser would keep it.
- **Works without React**: the same chain over a plain registry.

### Sequences, holds and waits

```tsx
shortcut
    .key("g")
    .then.key("d")
    .on(() => router.push("/dashboard"))

shortcut.hold("space").on(({ phase, duration }) => setPeeking(phase === "start"))

shortcut.key("j").then.wait(300).key("k").on(jump)

shortcut.key("escape").or.mod.key("d").on(close)
```

A sequence step has to arrive within one second of the previous one. A hold fires `start` after 500 ms and `release` on keyup; a shorter press on the same key is a tap, so `key("c")` and `hold("c")` can coexist. Both timings can be changed on the provider.

### Scopes

Scopes are optional. Declare them once and `.in()` accepts only those names.

```tsx
export const { shortcut, ShortcutProvider } = createShortcuts({ scopes: ["app", "editor"] })

<ShortcutProvider scopes={["app"]}>...</ShortcutProvider>

shortcut.key("escape").in("app").on(close)
shortcut.mod.key("b").in("editor").on(bold)
```

A binding without `.in()` is global. `web` and `desktop` are always available: only the one matching where the app runs starts enabled, so this pair gives each host its own key for the same action.

```tsx
shortcut.mod.key("n").in("desktop").on(newNote)
shortcut.mod.shift.key("n").in("web").on(newNote)
```

### Regions and help screens

A nested `ShortcutProvider` is an isolated region: outer shortcuts do not fire inside it, except the combos you list in `inherit`. `ShortcutBoundary` turns shortcuts off for a subtree while `disabled` is true. `useShortcutList()` returns the active bindings with their `display` and `describe` text and re-renders when they change.

```tsx
const { useShortcutList } = createShortcuts()

function Help() {
    const bindings = useShortcutList()
    return bindings.map((binding) => (
        <li key={binding.id}>
            <kbd>{binding.display}</kbd> {binding.description}
        </li>
    ))
}
```

### Plain JavaScript and Tauri

```ts
import { createShortcuts } from "@remcostoeten/use-shortcut"

const { shortcut, registry } = createShortcuts({ scopes: ["app"] })

const palette = shortcut.mod.key("k").in("app").on(openPalette)
registry.enable("app")
palette.unbind()
```

The registry listens on the window. In a Tauri 2 window everything works the same, and `detectHost()` reports `"desktop"` there so the right host scope is enabled.

The reasoning behind every rule is in [DECISIONS.md](DECISIONS.md).

## Install

3.x is in beta and published under the `beta` tag:

```bash
bun add @remcostoeten/use-shortcut@beta
```

```bash
npm install @remcostoeten/use-shortcut@beta
```

React 18 or newer is an optional peer dependency, needed only for the `react` entry.

3.x is a rewrite and its API is not compatible with 2.x. Version 2.x stays on the `latest` tag and lives on the [`master`](https://github.com/remcostoeten/use-shortcut/tree/master) branch; the changes are listed in [CHANGELOG.md](CHANGELOG.md).

## Development

Bun 1.4 and TypeScript 6.

```bash
bun run check          # typecheck, lint, format check and unit tests
bun run e2e            # Playwright suite in Chromium, two workers
bun run check:package  # build with tsdown, then publint and attw
```

<br/>

xxx,<br/>
[Remco Stoeten](https://remcostoeten.com)<br/>
<small>MIT</small>
