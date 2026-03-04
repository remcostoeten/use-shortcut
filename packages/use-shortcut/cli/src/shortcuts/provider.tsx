"use client"

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

/** Props for the scaffolded `ShortcutProvider`. */
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
 * Reads the shortcut manager context exposed by `ShortcutProvider`.
 */
export function useShortcutManager(): ShortcutContextValue {
    const context = useContext(_ShortcutContext)

    if (!context) {
        throw new Error("useShortcutManager must be used within <ShortcutProvider>")
    }

    return context
}
