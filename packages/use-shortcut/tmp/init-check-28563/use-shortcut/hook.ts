"use client"

import { useEffect, useRef, useMemo } from "react"
import { _createShortcutBuilder } from "./builder"
import type {
    ShortcutBuilder,
    UseShortcutOptions,
    ShortcutMap,
    ShortcutMapResult,
    ShortcutMapEntry,
    ShortcutGroup,
    ShortcutResult,
    ShortcutHandler,
    HandlerOptions,
    ActionKey,
} from "./types"

type ShortcutMapSequenceChain = {
    then: (step: string) => ShortcutMapSequenceChain
    on: (handler: ShortcutHandler, options?: HandlerOptions) => ShortcutResult
}

type ShortcutMapChain = {
    ctrl: ShortcutMapChain
    shift: ShortcutMapChain
    alt: ShortcutMapChain
    cmd: ShortcutMapChain
    mod: ShortcutMapChain
    key: (key: ActionKey) => ShortcutMapSequenceChain
}

function areShortcutMapKeysEqual(a: ShortcutMapEntry["keys"], b: ShortcutMapEntry["keys"]): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false
        for (let i = 0; i < a.length; i += 1) {
            if (a[i] !== b[i]) return false
        }
        return true
    }

    if (!Array.isArray(a) && !Array.isArray(b)) {
        return a === b
    }

    return false
}

function areShortcutMapsEquivalent(a: ShortcutMap, b: ShortcutMap): boolean {
    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)
    if (aKeys.length !== bKeys.length) return false

    for (const key of aKeys) {
        const aEntry = a[key]
        const bEntry = b[key]
        if (!bEntry) return false
        if (!areShortcutMapKeysEqual(aEntry.keys, bEntry.keys)) return false
        if (aEntry.handler !== bEntry.handler) return false
        if (aEntry.options !== bEntry.options) return false
    }

    return true
}

function normalizeShortcutMapKeys(keys: ShortcutMapEntry["keys"]): string[] {
    if (Array.isArray(keys)) {
        return keys.map((key) => key.trim()).filter(Boolean)
    }

    const trimmed = keys.trim()
    if (!trimmed) return []

    if (trimmed.includes(" then ")) {
        return trimmed.split(/\s+then\s+/i).map((key) => key.trim()).filter(Boolean)
    }

    if (trimmed.includes(" ") && !trimmed.includes("+")) {
        return trimmed.split(/\s+/).map((key) => key.trim()).filter(Boolean)
    }

    return [trimmed]
}

function applyStep(builder: ShortcutMapChain, step: string): ShortcutMapSequenceChain {
    const tokens = step
        .toLowerCase()
        .split("+")
        .map((token) => token.trim())
        .filter(Boolean)

    if (tokens.length === 0) {
        throw new Error("[useShortcutMap] Invalid step: empty shortcut step")
    }

    const key = tokens.pop()!
    let chain = builder

    for (const token of tokens) {
        if (token === "ctrl" || token === "control") {
            chain = chain.ctrl
            continue
        }

        if (token === "shift") {
            chain = chain.shift
            continue
        }

        if (token === "alt" || token === "option") {
            chain = chain.alt
            continue
        }

        if (token === "cmd" || token === "command" || token === "meta") {
            chain = chain.cmd
            continue
        }

        if (token === "mod") {
            chain = chain.mod
            continue
        }

        throw new Error(`[useShortcutMap] Unsupported modifier token "${token}" in step "${step}"`)
    }

    return chain.key(key as ActionKey)
}

export function registerShortcutMap<T extends ShortcutMap>(
    builder: ShortcutBuilder,
    shortcutMap: T,
): ShortcutMapResult<T> {
    const results = {} as ShortcutMapResult<T>

    for (const id of Object.keys(shortcutMap) as Array<keyof T>) {
        const entry = shortcutMap[id]
        const steps = normalizeShortcutMapKeys(entry.keys)

        if (steps.length === 0) {
            throw new Error(`[useShortcutMap] Shortcut "${String(id)}" has no key steps`)
        }

        let chain = applyStep(builder, steps[0])

        for (const step of steps.slice(1)) {
            chain = chain.then(step)
        }

        results[id] = chain.on(entry.handler, entry.options)
    }

    return results
}

/**
 * React hook for registering chainable keyboard shortcuts
 *
 * @param options - Configuration options for the hook
 * @returns A chainable shortcut builder (`$`)
 */
export function useShortcut(options: UseShortcutOptions = {}): ShortcutBuilder {
    const optionsRef = useRef(options)
    optionsRef.current = options

    const { builder, registry } = useMemo(() => {
        return _createShortcutBuilder(optionsRef.current)
    }, [])

    useEffect(() => {
        registry.options = optionsRef.current

        if (optionsRef.current.activeScopes !== undefined) {
            const scopes = Array.isArray(optionsRef.current.activeScopes)
                ? optionsRef.current.activeScopes
                : [optionsRef.current.activeScopes]

            registry.activeScopes = new Set(scopes.map((scope) => scope.trim()).filter(Boolean))
        }
    }, [registry, options])

    useEffect(() => {
        return () => {
            registry.listeners.clear()
            registry.firstStepIndex.clear()
            registry.activeSequenceCombos.clear()

            if (registry.listener && registry.listenerTarget) {
                registry.listenerTarget.removeEventListener(registry.listenerEventType, registry.listener as EventListener)
                registry.listener = null
                registry.listenerTarget = null
            }
        }
    }, [registry])

    return builder as ShortcutBuilder
}

/**
 * Bulk registration helper for shortcut maps.
 */
export function useShortcutMap<T extends ShortcutMap>(
    shortcutMap: T,
    options: UseShortcutOptions = {},
): ShortcutMapResult<T> {
    const $ = useShortcut(options)
    const stableShortcutMapRef = useRef(shortcutMap)
    if (!areShortcutMapsEquivalent(stableShortcutMapRef.current, shortcutMap)) {
        stableShortcutMapRef.current = shortcutMap
    }

    const stableShortcutMap = stableShortcutMapRef.current
    const resultsRef = useRef<ShortcutMapResult<T>>({} as ShortcutMapResult<T>)

    useEffect(() => {
        const registrations = registerShortcutMap($, stableShortcutMap)
        const results = resultsRef.current
        for (const key of Object.keys(results)) {
            delete (results as Record<string, unknown>)[key]
        }
        Object.assign(results, registrations)

        return () => {
            for (const result of Object.values(registrations)) {
                result.unbind()
            }
            for (const key of Object.keys(results)) {
                delete (results as Record<string, unknown>)[key]
            }
        }
    }, [$, stableShortcutMap])

    return resultsRef.current
}

export function createShortcutGroup(): ShortcutGroup {
    const results: ShortcutResult[] = []

    return {
        add: (...entries: ShortcutResult[]) => {
            results.push(...entries)
        },
        addMany: (entries: ShortcutResult[] | Record<string, ShortcutResult>) => {
            if (Array.isArray(entries)) {
                results.push(...entries)
                return
            }

            results.push(...Object.values(entries))
        },
        unbindAll: () => {
            for (const entry of results) {
                entry.unbind()
            }
            results.length = 0
        },
        clear: () => {
            results.length = 0
        },
        getResults: () => [...results],
    }
}

export function useShortcutGroup(): ShortcutGroup {
    const groupRef = useRef<ShortcutGroup | null>(null)

    if (!groupRef.current) {
        groupRef.current = createShortcutGroup()
    }

    return groupRef.current
}
