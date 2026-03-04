#!/usr/bin/env node
import{existsSync as h,mkdirSync as f,readFileSync as w,writeFileSync as x}from"fs";import{join as l,dirname as B}from"path";import{fileURLToPath as A}from"url";function m(t){return{"scopes.ts":`export const shortcutScopes = ["global", "navigation", "editor", "modal"] as const

export type ShortcutScope = (typeof shortcutScopes)[number]

export const defaultActiveScopes: ShortcutScope[] = ["global", "navigation"]

export function normalizeScopes(scopes: ShortcutScope | ShortcutScope[]): ShortcutScope[] {
    return Array.isArray(scopes) ? scopes : [scopes]
}
`,"registry.ts":`import type { HandlerOptions } from "@remcostoeten/use-shortcut"
import type { ShortcutScope } from "./scopes"

export type ShortcutDefinition = {
    description: string
    defaultKeys: string | string[]
    scopes: ShortcutScope[]
    options?: Omit<HandlerOptions, "scopes">
}

export const shortcutRegistry = {
    openCommandPalette: {
        description: "Open global command palette",
        defaultKeys: "mod+k",
        scopes: ["global", "navigation"],
    },
    saveDocument: {
        description: "Save the active editor document",
        defaultKeys: "mod+s",
        scopes: ["editor"],
    },
    goDashboard: {
        description: "Navigate to dashboard (vim style sequence)",
        defaultKeys: ["g", "d"],
        scopes: ["navigation"],
    },
    closeOverlay: {
        description: "Close active overlay",
        defaultKeys: "escape",
        scopes: ["global", "modal"],
    },
} as const satisfies Record<string, ShortcutDefinition>

export type ShortcutActionId = keyof typeof shortcutRegistry
export type ShortcutBindings = Record<ShortcutActionId, string | string[]>
`,"types.ts":`import type { ShortcutActionId, ShortcutBindings } from "./registry"
import type { ShortcutScope } from "./scopes"

export type ShortcutHandlers = Record<ShortcutActionId, (event: KeyboardEvent) => void>

export type ShortcutState = {
    activeScopes: ShortcutScope[]
    bindings: ShortcutBindings
    enabled: boolean
}

export type ShortcutActions = {
    setScopes: (scopes: ShortcutScope | ShortcutScope[]) => void
    enableScope: (scope: ShortcutScope) => void
    disableScope: (scope: ShortcutScope) => void
    setBinding: (actionId: ShortcutActionId, keys: string | string[]) => void
    resetBinding: (actionId: ShortcutActionId) => void
    resetBindings: () => void
    setEnabled: (enabled: boolean) => void
}

export type ShortcutMeta = {
    hasBindingOverrides: boolean
    availableActions: ShortcutActionId[]
}

export type ShortcutContextValue = {
    state: ShortcutState
    actions: ShortcutActions
    meta: ShortcutMeta
}
`,"runtime.ts":`import type { ShortcutMap } from "@remcostoeten/use-shortcut"
import { shortcutRegistry, type ShortcutActionId, type ShortcutBindings } from "./registry"
import type { ShortcutHandlers } from "./types"

export function createDefaultBindings(): ShortcutBindings {
    const bindings = {} as ShortcutBindings

    for (const actionId of Object.keys(shortcutRegistry) as ShortcutActionId[]) {
        bindings[actionId] = shortcutRegistry[actionId].defaultKeys
    }

    return bindings
}

export function createShortcutMap(bindings: ShortcutBindings, handlers: ShortcutHandlers): ShortcutMap {
    const map: ShortcutMap = {}

    for (const actionId of Object.keys(shortcutRegistry) as ShortcutActionId[]) {
        const definition = shortcutRegistry[actionId]
        const handler = handlers[actionId]

        if (!handler) {
            continue
        }

        map[actionId] = {
            keys: bindings[actionId],
            handler,
            options: {
                ...definition.options,
                scopes: definition.scopes,
                description: definition.description,
            },
        }
    }

    return map
}
`,"storage.ts":`import type { ShortcutActionId, ShortcutBindings } from "./registry"

export const DEFAULT_SHORTCUT_STORAGE_KEY = "app-shortcut-bindings"

function isBindingValue(value: unknown): value is string | string[] {
    if (typeof value === "string") return true
    return Array.isArray(value) && value.every((entry) => typeof entry === "string")
}

export function loadShortcutBindings(storageKey: string): Partial<ShortcutBindings> {
    if (typeof window === "undefined") return {}

    try {
        const raw = window.localStorage.getItem(storageKey)
        if (!raw) return {}

        const parsed = JSON.parse(raw) as unknown
        if (!parsed || typeof parsed !== "object") return {}

        const result: Partial<ShortcutBindings> = {}

        for (const [actionId, value] of Object.entries(parsed as Record<string, unknown>)) {
            if (!isBindingValue(value)) continue
            result[actionId as ShortcutActionId] = value
        }

        return result
    } catch {
        return {}
    }
}

export function saveShortcutBindings(storageKey: string, bindings: ShortcutBindings): void {
    if (typeof window === "undefined") return

    try {
        window.localStorage.setItem(storageKey, JSON.stringify(bindings))
    } catch {
        // Ignore quota/security errors.
    }
}

export function clearShortcutBindings(storageKey: string): void {
    if (typeof window === "undefined") return

    try {
        window.localStorage.removeItem(storageKey)
    } catch {
        // Ignore quota/security errors.
    }
}
`,"provider.tsx":`"use client"

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react"
import { registerShortcutMap, useShortcut, type UseShortcutOptions } from "@remcostoeten/use-shortcut"
import { shortcutRegistry, type ShortcutActionId, type ShortcutBindings } from "./registry"
import { createDefaultBindings, createShortcutMap } from "./runtime"
import { defaultActiveScopes, normalizeScopes, type ShortcutScope } from "./scopes"
import {
    DEFAULT_SHORTCUT_STORAGE_KEY,
    clearShortcutBindings,
    loadShortcutBindings,
    saveShortcutBindings,
} from "./storage"
import type { ShortcutContextValue, ShortcutHandlers } from "./types"

const ShortcutContext = createContext<ShortcutContextValue | null>(null)

function mergeBindings(defaultBindings: ShortcutBindings, persisted: Partial<ShortcutBindings>): ShortcutBindings {
    const merged = { ...defaultBindings }

    for (const actionId of Object.keys(defaultBindings) as ShortcutActionId[]) {
        const value = persisted[actionId]
        if (typeof value === "string" || Array.isArray(value)) {
            merged[actionId] = value
        }
    }

    return merged
}

function sameBinding(a: string | string[], b: string | string[]): boolean {
    const left = Array.isArray(a) ? a.join("|") : a
    const right = Array.isArray(b) ? b.join("|") : b
    return left === right
}

function hasBindingOverrides(bindings: ShortcutBindings): boolean {
    const defaults = createDefaultBindings()

    for (const actionId of Object.keys(defaults) as ShortcutActionId[]) {
        if (!sameBinding(bindings[actionId], defaults[actionId])) {
            return true
        }
    }

    return false
}

export type ShortcutProviderProps = {
    children: ReactNode
    handlers: ShortcutHandlers
    initialScopes?: ShortcutScope[]
    initialEnabled?: boolean
    persistBindings?: boolean
    storageKey?: string
    shortcutOptions?: Omit<UseShortcutOptions, "activeScopes" | "disabled">
}

export function ShortcutProvider({
    children,
    handlers,
    initialScopes = defaultActiveScopes,
    initialEnabled = true,
    persistBindings = true,
    storageKey = DEFAULT_SHORTCUT_STORAGE_KEY,
    shortcutOptions,
}: ShortcutProviderProps) {
    const [activeScopes, setActiveScopes] = useState<ShortcutScope[]>(initialScopes)
    const [enabled, setEnabled] = useState(initialEnabled)
    const [bindings, setBindings] = useState<ShortcutBindings>(() => createDefaultBindings())

    useEffect(() => {
        setEnabled(initialEnabled)
    }, [initialEnabled])

    useEffect(() => {
        if (!persistBindings) return

        const persisted = loadShortcutBindings(storageKey)
        setBindings((current) => mergeBindings(current, persisted))
    }, [persistBindings, storageKey])

    useEffect(() => {
        if (!persistBindings) return
        saveShortcutBindings(storageKey, bindings)
    }, [bindings, persistBindings, storageKey])

    const shortcutMap = useMemo(() => createShortcutMap(bindings, handlers), [bindings, handlers])

    const $ = useShortcut({
        ...shortcutOptions,
        activeScopes,
        disabled: !enabled,
    })

    useEffect(() => {
        const registrations = registerShortcutMap($, shortcutMap)

        return () => {
            for (const result of Object.values(registrations)) {
                result.unbind()
            }
        }
    }, [$, shortcutMap])

    const setScopes = useCallback((scopes: ShortcutScope | ShortcutScope[]) => {
        setActiveScopes(normalizeScopes(scopes))
    }, [])

    const enableScope = useCallback((scope: ShortcutScope) => {
        setActiveScopes((current) => {
            if (current.includes(scope)) return current
            return [...current, scope]
        })
    }, [])

    const disableScope = useCallback((scope: ShortcutScope) => {
        setActiveScopes((current) => current.filter((item) => item !== scope))
    }, [])

    const setBinding = useCallback((actionId: ShortcutActionId, keys: string | string[]) => {
        setBindings((current) => ({
            ...current,
            [actionId]: keys,
        }))
    }, [])

    const resetBinding = useCallback((actionId: ShortcutActionId) => {
        setBindings((current) => ({
            ...current,
            [actionId]: shortcutRegistry[actionId].defaultKeys,
        }))
    }, [])

    const resetBindings = useCallback(() => {
        setBindings(createDefaultBindings())
        if (persistBindings) clearShortcutBindings(storageKey)
    }, [persistBindings, storageKey])

    const contextValue = useMemo<ShortcutContextValue>(
        () => ({
            state: {
                activeScopes,
                bindings,
                enabled,
            },
            actions: {
                setScopes,
                enableScope,
                disableScope,
                setBinding,
                resetBinding,
                resetBindings,
                setEnabled,
            },
            meta: {
                hasBindingOverrides: hasBindingOverrides(bindings),
                availableActions: Object.keys(shortcutRegistry) as ShortcutActionId[],
            },
        }),
        [
            activeScopes,
            bindings,
            enabled,
            setScopes,
            enableScope,
            disableScope,
            setBinding,
            resetBinding,
            resetBindings,
        ],
    )

    return <ShortcutContext.Provider value={contextValue}>{children}</ShortcutContext.Provider>
}

export function useShortcutManager(): ShortcutContextValue {
    const context = useContext(ShortcutContext)

    if (!context) {
        throw new Error("useShortcutManager must be used within <ShortcutProvider>")
    }

    return context
}
`,"index.ts":`export { ShortcutProvider, useShortcutManager, type ShortcutProviderProps } from "./provider"
export { shortcutRegistry, type ShortcutActionId, type ShortcutBindings } from "./registry"
export { defaultActiveScopes, shortcutScopes, type ShortcutScope } from "./scopes"
export type {
    ShortcutContextValue,
    ShortcutActions,
    ShortcutHandlers,
    ShortcutMeta,
    ShortcutState,
} from "./types"
`,"README.md":`# Shortcut Architecture Scaffold

This folder was generated by \`use-shortcut scaffold\`.

It follows a scalable architecture with a strict split between:

- **Registry (data)**: \`registry.ts\` is the single source of truth for action ids, default keys, scope ownership, and metadata.
- **Runtime assembly**: \`runtime.ts\` converts registry + current bindings + handlers into a runtime map.
- **State and actions provider**: \`provider.tsx\` owns scope state, binding overrides, and persistence.
- **Storage adapter**: \`storage.ts\` isolates persistence so you can swap \`localStorage\` for API/DB.
- **Typed contract**: \`types.ts\` exposes \`state/actions/meta\` for UI and feature modules.

## How To Extend

1. Add a new action in \`registry.ts\`.
2. Implement its handler in your app and pass it via \`handlers\` to \`<ShortcutProvider>\`.
3. Optionally expose a user-configurable key in your settings UI through \`useShortcutManager().actions.setBinding\`.
4. Activate scopes from feature boundaries (for example editor route enters \`editor\` scope).

${t==="next"?"## Next.js Integration\n\n1. Create a client provider wrapper at `app/shortcut-provider.tsx` and render `<ShortcutProvider />` there.\n2. Render that provider inside `app/layout.tsx` around your app shell.\n3. Keep page/server components pure; shortcut handlers stay in client components.\n":"## React Integration\n\n1. Wrap your app root (for example in `main.tsx`) with `<ShortcutProvider />`.\n2. Keep handlers in a top-level client component and pass them to the provider via `handlers`.\n3. Use `useShortcutManager()` inside feature components to toggle scopes and bindings.\n"}
## Rules For Scale

- Keep handlers side-effect focused and feature-owned; keep the registry declarative.
- Use scopes instead of conditionals in handlers.
- Persist only key bindings, not executable handlers.
- Treat \`registry.ts\` as your architectural contract.
`}}var k=A(import.meta.url),O=B(k),e={reset:"\x1B[0m",green:"\x1B[32m",cyan:"\x1B[36m",yellow:"\x1B[33m",dim:"\x1B[2m",red:"\x1B[31m"};function r(t,o=e.reset){console.log(`${o}${t}${e.reset}`)}function C(){return l(O,"..","src")}function R(t){return l(process.cwd(),t,"use-shortcut")}function E(t,o){return l(process.cwd(),t,o)}function p(t,o,a){let s=t.indexOf(o);if(s===-1)return a;let n=t[s+1];return!n||n.startsWith("--")?a:n}function g(t,o){return t.includes(o)}var P=["index.ts","hook.ts","builder.ts","types.ts","parser.ts","constants.ts","formatter.ts","runtime/types.ts","runtime/binding.ts","runtime/conflicts.ts","runtime/debug.ts","runtime/guards.ts","runtime/keys.ts","runtime/listener.ts","runtime/recording.ts"];function K(t="hooks",o=!1){let a=C(),s=R(t);if(r(`
use-shortcut CLI
`,e.cyan),h(s)&&!o){r(`Directory already exists: ${s}`,e.yellow),r(`Use --force to overwrite existing files
`,e.dim);return}f(s,{recursive:!0});let n=0;for(let i of P){let c=l(a,i),u=l(s,i);if(f(B(u),{recursive:!0}),!h(c)){r(`Source file not found: ${i}`,e.yellow);continue}let d=w(c,"utf-8");x(u,d),n+=1,r(`  wrote ${i}`,e.green)}r(`
Copied ${n} files to:`,e.green),r(`  ${s}
`,e.dim),r("Usage:",e.cyan),r(`  import { useShortcut } from "@/${t}/use-shortcut"`,e.dim),r("  const $ = useShortcut()",e.dim),r(`  $.mod.key("k").on(() => console.log("Search"))
`,e.dim)}function y(t,o="src",a="shortcuts",s=!1){let n=E(o,a),i=m(t);r(`
use-shortcut CLI
`,e.cyan),r(`Scaffolding ${t} architecture in ${n}
`,e.dim),f(n,{recursive:!0});let c=0,u=0;for(let[d,I]of Object.entries(i)){let S=l(n,d);if(h(S)&&!s){u+=1,r(`  skipped ${d} (already exists)`,e.yellow);continue}x(S,I),c+=1,r(`  wrote ${d}`,e.green)}r("",e.reset),r(`Architecture scaffold complete: ${c} written, ${u} skipped.`,e.green),r(`Location: ${n}
`,e.dim),r("Next steps:",e.cyan),r(`  1. Open ${l(o,a,"registry.ts")} and define your action catalog`,e.dim),r("  2. Wire app handlers into <ShortcutProvider handlers={...} />",e.dim),r("  3. Toggle scopes from feature boundaries via useShortcutManager()",e.dim),r(`  4. Optionally expose setBinding/resetBinding in your settings UI
`,e.dim)}function b(){r(`
use-shortcut CLI
`,e.cyan),r("Commands:",e.yellow),r("  init [--target hooks] [--force]",e.dim),r("      Copy source files into your project (shadcn-style).",e.dim),r("",e.dim),r("  scaffold [--framework next|react] [--target src] [--dir shortcuts] [--force]",e.dim),r("      Generate a scalable app shortcut architecture.",e.dim),r("",e.dim),r("  init --architecture",e.dim),r(`      Alias for scaffold with defaults.
`,e.dim)}function v(t){if(t==="next"||t==="react")return t;r(`Invalid framework: ${t}. Expected "next" or "react".`,e.red),process.exit(1)}function M(){let t=process.argv.slice(2),o=t[0];if(!o||o==="--help"||o==="-h"||o==="help"){b();return}if(o==="init"){if(g(t,"--architecture")||g(t,"--app")||g(t,"--scaffold")){let i=v(p(t,"--framework","next")),c=p(t,"--target","src"),u=p(t,"--dir","shortcuts"),d=g(t,"--force");y(i,c,u,d);return}let s=p(t,"--target","hooks"),n=g(t,"--force");K(s,n);return}if(o==="scaffold"||o==="architecture"){let s=v(p(t,"--framework","next")),n=p(t,"--target","src"),i=p(t,"--dir","shortcuts"),c=g(t,"--force");y(s,n,i,c);return}b(),process.exit(1)}M();
