"use client"

import { useEffect, useRef, useMemo } from "react"
import { _createShortcutBuilder } from "./builder"
import { _removeRegistryEntry } from "./runtime/binding"
import { _attachRegistryListener } from "./runtime/listener"
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

function _areShortcutMapKeysEqual(a: ShortcutMapEntry["keys"], b: ShortcutMapEntry["keys"]): boolean {
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

function _areShortcutMapsEquivalent(a: ShortcutMap, b: ShortcutMap): boolean {
    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)
    if (aKeys.length !== bKeys.length) return false

    for (const key of aKeys) {
        const aEntry = a[key]
        const bEntry = b[key]
        if (!bEntry) return false
        if (!_areShortcutMapKeysEqual(aEntry.keys, bEntry.keys)) return false
        if (aEntry.handler !== bEntry.handler) return false
        if (aEntry.options !== bEntry.options) return false
    }

    return true
}

function _normalizeShortcutMapKeys(keys: ShortcutMapEntry["keys"]): string[] {
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

function _createPendingShortcutResult(keys: ShortcutMapEntry["keys"]): ShortcutResult {
    const combo = Array.isArray(keys) ? keys.join(" | ") : keys
    return {
        unbind: () => {},
        display: combo,
        combo,
        trigger: () => {},
        isEnabled: false,
        enable: () => {},
        disable: () => {},
        onAttempt: () => () => {},
    }
}

function _applyStep(builder: ShortcutMapChain, step: string): ShortcutMapSequenceChain {
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

/**
 * Registers an object-based shortcut map in one call and returns per-action handles.
 *
 * @param builder - Builder returned by `useShortcut()`
 * @param shortcutMap - Record of action ids to key bindings, handlers, and options
 * @returns A result map with one `ShortcutResult` per shortcut id
 *
 * @example
 * ```ts
 * const $ = useShortcut()
 * const results = registerShortcutMap($, {
 *   save: { keys: "mod+s", handler: onSave },
 *   nav: { keys: ["g", "d"], handler: onGoDashboard },
 * })
 * ```
 */
export function registerShortcutMap<T extends ShortcutMap>(
    builder: ShortcutBuilder,
    shortcutMap: T,
): ShortcutMapResult<T> {
    const results = {} as ShortcutMapResult<T>

    for (const id of Object.keys(shortcutMap) as Array<keyof T>) {
        const entry = shortcutMap[id]
        const steps = _normalizeShortcutMapKeys(entry.keys)

        if (steps.length === 0) {
            throw new Error(`[useShortcutMap] Shortcut "${String(id)}" has no key steps`)
        }

        let chain = _applyStep(builder, steps[0])

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
 *
 * @example
 * ```ts
 * const $ = useShortcut({ activeScopes: ["editor"] })
 * $.mod.key("s").on((event) => {
 *   event.preventDefault()
 *   saveDocument()
 * })
 * ```
 */
export function useShortcut(options: UseShortcutOptions = {}): ShortcutBuilder {
    const optionsRef = useRef(options)
    optionsRef.current = options

    const { builder, registry } = useMemo(() => {
        return _createShortcutBuilder(optionsRef.current)
    }, [])

    registry.reconcileRenderBindings = true
    registry.collectingRenderBindings = true
    registry.renderCycle += 1
    registry.nextRenderSlot = 0

    useEffect(() => {
        registry.options = optionsRef.current

        if (optionsRef.current.activeScopes !== undefined) {
            const scopes = Array.isArray(optionsRef.current.activeScopes)
                ? optionsRef.current.activeScopes
                : [optionsRef.current.activeScopes]

            registry.activeScopes = new Set(scopes.map((scope) => scope.trim()).filter(Boolean))
        }

        for (const entry of [...registry.renderSlots.values()]) {
            if (entry.lastSeenRenderCycle !== registry.renderCycle) {
                _removeRegistryEntry(registry, entry)
            }
        }

        if (registry.listeners.size > 0) {
            _attachRegistryListener(registry)
        }

        registry.collectingRenderBindings = false
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
 * React hook that registers a shortcut map and automatically unbinds on cleanup.
 *
 * @param shortcutMap - Record of action ids to key bindings, handlers, and options
 * @param options - Same options as `useShortcut()`
 * @returns A map of `ShortcutResult` keyed by your shortcut ids
 *
 * @example
 * ```ts
 * const mapResults = useShortcutMap({
 *   save: { keys: "mod+s", handler: onSave },
 *   close: { keys: "escape", handler: onClose },
 * })
 * ```
 */
export function useShortcutMap<T extends ShortcutMap>(
    shortcutMap: T,
    options: UseShortcutOptions = {},
): ShortcutMapResult<T> {
    const $ = useShortcut(options)
    const stableShortcutMapRef = useRef(shortcutMap)
    if (!_areShortcutMapsEquivalent(stableShortcutMapRef.current, shortcutMap)) {
        stableShortcutMapRef.current = shortcutMap
    }

    const stableShortcutMap = stableShortcutMapRef.current
    const resultsRef = useRef<ShortcutMapResult<T>>({} as ShortcutMapResult<T>)
    const results = resultsRef.current

    for (const id of Object.keys(stableShortcutMap) as Array<keyof T>) {
        if (!results[id]) {
            results[id] = _createPendingShortcutResult(stableShortcutMap[id].keys) as ShortcutMapResult<T>[keyof T]
        }
    }

    for (const id of Object.keys(results) as Array<keyof T>) {
        if (!stableShortcutMap[id]) {
            delete (results as Record<string, unknown>)[String(id)]
        }
    }

    useEffect(() => {
        const registrations = registerShortcutMap($, stableShortcutMap)
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

/**
 * Creates an imperative group controller for many shortcut registrations.
 *
 * @returns A `ShortcutGroup` that can add and unbind multiple shortcuts together
 *
 * @example
 * ```ts
 * const group = createShortcutGroup()
 * group.add($.mod.key("s").on(onSave))
 * group.add($.key("escape").on(onClose))
 * group.unbindAll()
 * ```
 */
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

/**
 * React hook that returns a stable `ShortcutGroup` instance.
 *
 * @returns A memoized `ShortcutGroup` tied to the component lifecycle
 *
 * @example
 * ```ts
 * const group = useShortcutGroup()
 * ```
 */
export function useShortcutGroup(): ShortcutGroup {
    const groupRef = useRef<ShortcutGroup | null>(null)

    if (!groupRef.current) {
        groupRef.current = createShortcutGroup()
    }

    return groupRef.current
}
