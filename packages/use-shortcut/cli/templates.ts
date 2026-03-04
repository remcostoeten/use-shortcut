export type ScaffoldFramework = "react" | "next"

export function _getArchitectureTemplates(framework: ScaffoldFramework): Record<string, string> {
    const _integrationSection =
        framework === "next"
            ? `## Next.js Integration\n\n1. Create a client provider wrapper at \`app/shortcut-provider.tsx\` and render \`<ShortcutProvider />\` there.\n2. Render that provider inside \`app/layout.tsx\` around your app shell.\n3. Keep page/server components pure; shortcut handlers stay in client components.\n`
            : `## React Integration\n\n1. Wrap your app root (for example in \`main.tsx\`) with \`<ShortcutProvider />\`.\n2. Keep handlers in a top-level client component and pass them to the provider via \`handlers\`.\n3. Use \`useShortcutManager()\` inside feature components to toggle scopes and bindings.\n`

    return {
        "scopes.ts": `/** App-defined scope catalog used by the scaffolded provider. */
export const shortcutScopes = ["global", "navigation", "editor", "modal"] as const

export type ShortcutScope = (typeof shortcutScopes)[number]

/** Default active scopes at provider boot. */
export const defaultActiveScopes: ShortcutScope[] = ["global", "navigation"]

/**
 * Normalizes a scope input into an array form.
 *
 * @param scopes - One or many scope names
 * @returns Array of scope names
 */
export function normalizeScopes(scopes: ShortcutScope | ShortcutScope[]): ShortcutScope[] {
    return Array.isArray(scopes) ? scopes : [scopes]
}
`,
        "registry.ts": `import type { HandlerOptions } from "@remcostoeten/use-shortcut"
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
`,
        "types.ts": `import type { ShortcutActionId, ShortcutBindings } from "./registry"
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
`,
        "runtime.ts": `import type { ShortcutMap } from "@remcostoeten/use-shortcut"
import { shortcutRegistry, type ShortcutActionId, type ShortcutBindings } from "./registry"
import type { ShortcutHandlers } from "./types"

/**
 * Returns a fresh binding object seeded from \`shortcutRegistry\` defaults.
 *
 * @returns Default shortcut bindings for every registered action
 */
export function createDefaultShortcutBindings(): ShortcutBindings {
    const bindings = {} as ShortcutBindings

    for (const actionId of Object.keys(shortcutRegistry) as ShortcutActionId[]) {
        bindings[actionId] = shortcutRegistry[actionId].defaultKeys
    }

    return bindings
}

/**
 * Builds a \`ShortcutMap\` by combining current bindings with action handlers.
 * Actions without handlers are skipped.
 *
 * @param bindings - Current binding state (defaults + user overrides)
 * @param handlers - Runtime action handlers from the consuming app
 * @returns Runtime shortcut map consumable by \`registerShortcutMap\`
 */
export function buildShortcutMap(bindings: ShortcutBindings, handlers: ShortcutHandlers): ShortcutMap {
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
`,
        "storage.ts": `import type { ShortcutActionId, ShortcutBindings } from "./registry"

/** Default localStorage key used by the scaffolded shortcut provider. */
export const DEFAULT_SHORTCUT_STORAGE_KEY = "app-shortcut-bindings"

function _isBindingValue(value: unknown): value is string | string[] {
    if (typeof value === "string") return true
    return Array.isArray(value) && value.every((entry) => typeof entry === "string")
}

/**
 * Loads persisted shortcut binding overrides from localStorage.
 *
 * @param storageKey - Storage key namespace
 * @returns Partial binding overrides keyed by action id
 */
export function loadShortcutBindings(storageKey: string): Partial<ShortcutBindings> {
    if (typeof window === "undefined") return {}

    try {
        const raw = window.localStorage.getItem(storageKey)
        if (!raw) return {}

        const parsed = JSON.parse(raw) as unknown
        if (!parsed || typeof parsed !== "object") return {}

        const result: Partial<ShortcutBindings> = {}

        for (const [actionId, value] of Object.entries(parsed as Record<string, unknown>)) {
            if (!_isBindingValue(value)) continue
            result[actionId as ShortcutActionId] = value
        }

        return result
    } catch {
        return {}
    }
}

/**
 * Persists all shortcut bindings to localStorage.
 *
 * @param storageKey - Storage key namespace
 * @param bindings - Full current binding set
 */
export function saveShortcutBindings(storageKey: string, bindings: ShortcutBindings): void {
    if (typeof window === "undefined") return

    try {
        window.localStorage.setItem(storageKey, JSON.stringify(bindings))
    } catch {
        // Ignore quota/security errors.
    }
}

/**
 * Removes persisted shortcut bindings from localStorage.
 *
 * @param storageKey - Storage key namespace
 */
export function clearShortcutBindings(storageKey: string): void {
    if (typeof window === "undefined") return

    try {
        window.localStorage.removeItem(storageKey)
    } catch {
        // Ignore quota/security errors.
    }
}
`,
        "provider.tsx": `"use client"

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
import { buildShortcutMap, createDefaultShortcutBindings } from "./runtime"
import { defaultActiveScopes, normalizeScopes, type ShortcutScope } from "./scopes"
import {
    DEFAULT_SHORTCUT_STORAGE_KEY,
    clearShortcutBindings,
    loadShortcutBindings,
    saveShortcutBindings,
} from "./storage"
import type { ShortcutContextValue, ShortcutHandlers } from "./types"

const _ShortcutContext = createContext<ShortcutContextValue | null>(null)

function _mergeBindings(defaultBindings: ShortcutBindings, persisted: Partial<ShortcutBindings>): ShortcutBindings {
    const merged = { ...defaultBindings }

    for (const actionId of Object.keys(defaultBindings) as ShortcutActionId[]) {
        const value = persisted[actionId]
        if (typeof value === "string" || Array.isArray(value)) {
            merged[actionId] = value
        }
    }

    return merged
}

function _isSameBinding(a: string | string[], b: string | string[]): boolean {
    const left = Array.isArray(a) ? a.join("|") : a
    const right = Array.isArray(b) ? b.join("|") : b
    return left === right
}

function _hasBindingOverrides(bindings: ShortcutBindings): boolean {
    const defaults = createDefaultShortcutBindings()

    for (const actionId of Object.keys(defaults) as ShortcutActionId[]) {
        if (!_isSameBinding(bindings[actionId], defaults[actionId])) {
            return true
        }
    }

    return false
}

/** Props for the scaffolded \`ShortcutProvider\`. */
export type ShortcutProviderProps = {
    children: ReactNode
    handlers: ShortcutHandlers
    initialScopes?: ShortcutScope[]
    initialEnabled?: boolean
    persistBindings?: boolean
    storageKey?: string
    shortcutOptions?: Omit<UseShortcutOptions, "activeScopes" | "disabled">
}

/**
 * App-level provider that binds action handlers, scope state, and optional binding persistence.
 */
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
    const [bindings, setBindings] = useState<ShortcutBindings>(() => createDefaultShortcutBindings())

    useEffect(() => {
        setEnabled(initialEnabled)
    }, [initialEnabled])

    useEffect(() => {
        if (!persistBindings) return

        const persisted = loadShortcutBindings(storageKey)
        setBindings((current) => _mergeBindings(current, persisted))
    }, [persistBindings, storageKey])

    useEffect(() => {
        if (!persistBindings) return
        saveShortcutBindings(storageKey, bindings)
    }, [bindings, persistBindings, storageKey])

    const shortcutMap = useMemo(() => buildShortcutMap(bindings, handlers), [bindings, handlers])

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
        setBindings(createDefaultShortcutBindings())
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
                hasBindingOverrides: _hasBindingOverrides(bindings),
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

    return <_ShortcutContext.Provider value={contextValue}>{children}</_ShortcutContext.Provider>
}

/**
 * Reads the shortcut manager context exposed by \`ShortcutProvider\`.
 */
export function useShortcutManager(): ShortcutContextValue {
    const context = useContext(_ShortcutContext)

    if (!context) {
        throw new Error("useShortcutManager must be used within <ShortcutProvider>")
    }

    return context
}
`,
        "index.ts": `export { ShortcutProvider, useShortcutManager, type ShortcutProviderProps } from "./provider"
export { shortcutRegistry, type ShortcutActionId, type ShortcutBindings } from "./registry"
export { defaultActiveScopes, shortcutScopes, type ShortcutScope } from "./scopes"
export type {
    ShortcutContextValue,
    ShortcutActions,
    ShortcutHandlers,
    ShortcutMeta,
    ShortcutState,
} from "./types"
`,
        "README.md": `# Shortcut Architecture Scaffold

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

${_integrationSection}
## Rules For Scale

- Keep handlers side-effect focused and feature-owned; keep the registry declarative.
- Use scopes instead of conditionals in handlers.
- Persist only key bindings, not executable handlers.
- Treat \`registry.ts\` as your architectural contract.
`
    }
}
