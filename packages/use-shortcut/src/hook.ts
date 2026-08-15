"use client"

import { useEffect, useRef, useMemo } from "react"
import { _createShortcutBuilder } from "./builder"
import { _splitSequenceSteps, parseShortcut } from "./parser"
import { _combineShortcutResults, _removeRegistryEntry } from "./runtime/binding"
import { _attachRegistryListener, _detachRegistryListener } from "./runtime/listener"
import type {
    ShortcutBuilder,
    UseShortcutOptions,
    ShortcutMap,
    ShortcutMapResult,
    ShortcutMapEntry,
    ShortcutBinding,
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

const _EMPTY_USE_SHORTCUT_OPTIONS: UseShortcutOptions = {}

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

function _areOptionValuesEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false
        for (let i = 0; i < a.length; i += 1) {
            if (a[i] !== b[i]) return false
        }
        return true
    }
    return false
}

function _areHandlerOptionsEqual(a?: HandlerOptions, b?: HandlerOptions): boolean {
    if (a === b) return true
    if (!a || !b) return false

    const aKeys = Object.keys(a) as Array<keyof HandlerOptions>
    if (aKeys.length !== Object.keys(b).length) return false

    for (const key of aKeys) {
        if (!_areOptionValuesEqual(a[key], b[key])) return false
    }

    return true
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
        if (!_areHandlerOptionsEqual(aEntry.options, bEntry.options)) return false
    }

    return true
}

/**
 * Normalizes `keys` into alternatives × sequence steps.
 * An array means alternatives (any one of them fires the handler); a string
 * with `" then "` (or bare spaces without `+`) means one multi-step sequence.
 */
function _normalizeShortcutMapKeys(keys: ShortcutMapEntry["keys"]): string[][] {
    if (Array.isArray(keys)) {
        return keys.map(_splitSequenceSteps).filter((alternative) => alternative.length > 0)
    }

    const steps = _splitSequenceSteps(keys)
    return steps.length > 0 ? [steps] : []
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

function _createDelegatingShortcutResult(source: { current: ShortcutResult }): ShortcutResult {
    return {
        unbind: () => source.current.unbind(),
        get display() {
            return source.current.display
        },
        get combo() {
            return source.current.combo
        },
        trigger: () => source.current.trigger(),
        get isEnabled() {
            return source.current.isEnabled
        },
        enable: () => source.current.enable(),
        disable: () => source.current.disable(),
        onAttempt: (callback) => source.current.onAttempt(callback),
    }
}

function _normalizeShortcutBindingArgs(
    keysOrBinding: ShortcutBinding["keys"] | ShortcutBinding,
    handlerOrShortcutOptions?: ShortcutHandler | UseShortcutOptions,
    handlerOptions?: HandlerOptions,
    shortcutOptions?: UseShortcutOptions,
): { binding: ShortcutBinding; shortcutOptions: UseShortcutOptions } {
    if (typeof keysOrBinding === "object" && !Array.isArray(keysOrBinding)) {
        return {
            binding: keysOrBinding,
            shortcutOptions: (handlerOrShortcutOptions as UseShortcutOptions | undefined) ?? _EMPTY_USE_SHORTCUT_OPTIONS,
        }
    }

    if (typeof handlerOrShortcutOptions !== "function") {
        throw new Error("[useShortcutBinding] A handler function is required for positional binding arguments.")
    }

    return {
        binding: {
            keys: keysOrBinding,
            handler: handlerOrShortcutOptions,
            options: handlerOptions,
        },
        shortcutOptions: shortcutOptions ?? _EMPTY_USE_SHORTCUT_OPTIONS,
    }
}

function _applyStep(builder: ShortcutMapChain, step: string): ShortcutMapSequenceChain {
    const parsed = parseShortcut(step)
    const key = parsed.key === " " ? "space" : parsed.key.toLowerCase()

    if (!key) {
        throw new Error("[useShortcutMap] Invalid step: empty shortcut step")
    }

    let chain = builder

    if (parsed.modifiers.ctrl) chain = chain.ctrl
    if (parsed.modifiers.alt) chain = chain.alt
    if (parsed.modifiers.shift) chain = chain.shift
    if (parsed.modifiers.meta) chain = chain.cmd

    return chain.key(key as ActionKey)
}

/**
 * Registers an object-based shortcut map in one call and returns per-action handles.
 *
 * `keys` accepts one combo (`"mod+s"`), one sequence (`"g then d"`), or an
 * array of alternatives (`["escape", "mod+d"]`) where any alternative fires
 * the handler. Each alternative may itself be a sequence string.
 *
 * @param builder - Builder returned by `useShortcut()`
 * @param shortcutMap - Record of action ids to key bindings, handlers, and options
 * @returns A result map with one `ShortcutResult` per shortcut id
 *
 * @example
 * ```ts
 * const $ = useShortcut()
 * const group = useShortcutGroup()
 *
 * useEffect(() => {
 *   const results = registerShortcutMap($, {
 *     save: { keys: "mod+s", handler: onSave },
 *     nav: { keys: "g then d", handler: onGoDashboard },
 *     close: { keys: ["escape", "mod+d"], handler: onClose },
 *   })
 *   group.addMany(results)
 *
 *   return () => group.unbindAll()
 * }, [$, group, onSave, onGoDashboard, onClose])
 * ```
 */
export function registerShortcutMap<T extends ShortcutMap>(
    builder: ShortcutBuilder,
    shortcutMap: T,
): ShortcutMapResult<T> {
    const results = {} as ShortcutMapResult<T>

    for (const id of Object.keys(shortcutMap) as Array<keyof T>) {
        const entry = shortcutMap[id]
        const alternatives = _normalizeShortcutMapKeys(entry.keys)

        if (alternatives.length === 0) {
            throw new Error(`[useShortcutMap] Shortcut "${String(id)}" has no key steps`)
        }

        const alternativeResults = alternatives.map((steps) => {
            let chain = _applyStep(builder, steps[0])

            for (const step of steps.slice(1)) {
                chain = chain.then(step)
            }

            return chain.on(entry.handler, entry.options)
        })

        results[id] = alternativeResults.length === 1
            ? alternativeResults[0]
            : _combineShortcutResults(alternativeResults)
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
 *
 * useEffect(() => {
 *   const saveShortcut = $.mod.key("s").on((event) => {
 *     event.preventDefault()
 *     saveDocument()
 *   })
 *
 *   return () => saveShortcut.unbind()
 * }, [$, saveDocument])
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

    // Close the render-binding window before any DOM event can fire: passive
    // effects flush after paint, so an imperative `.on()` from an early event
    // handler would otherwise be mistaken for a render binding and reconciled
    // away. Microtasks run before paint, so this is race-free.
    queueMicrotask(() => {
        registry.collectingRenderBindings = false
    })

    // No dependency array on purpose: render-binding reconciliation must run
    // after every commit, even when the caller memoizes `options`.
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
    })

    useEffect(() => {
        return () => {
            for (const entries of registry.listeners.values()) {
                for (const entry of entries) {
                    for (const timeoutId of entry.timeoutIds) {
                        clearTimeout(timeoutId)
                    }
                    entry.timeoutIds.clear()
                }
            }

            for (const cancelRecording of [...registry.pendingRecordings]) {
                cancelRecording()
            }

            registry.listeners.clear()
            registry.firstStepIndex.clear()
            registry.activeSequenceCombos.clear()
            registry.renderSlots.clear()

            _detachRegistryListener(registry)
        }
    }, [registry])

    return builder as ShortcutBuilder
}

/**
 * React hook for one cleanup-safe shortcut binding.
 *
 * @param keys - Shortcut combo string, sequence string, or array of alternative combos, such as `"mod+s"`, `"g then d"`, or `["escape", "mod+d"]`
 * @param handler - Handler invoked when the shortcut matches
 * @param options - Per-binding options such as `preventDefault`, `scopes`, and `priority`
 * @param shortcutOptions - Hook-level options such as `target`, `eventType`, and `activeScopes`
 * @returns A stable `ShortcutResult` handle. Before the effect runs, the handle is disabled and uses the provided keys as its display text.
 *
 * @example
 * ```ts
 * const saveShortcut = useShortcutBinding("mod+s", saveDocument, {
 *   description: "Save document",
 *   preventDefault: true,
 * })
 * ```
 */
export function useShortcutBinding(
    keys: ShortcutBinding["keys"],
    handler: ShortcutHandler,
    options?: HandlerOptions,
    shortcutOptions?: UseShortcutOptions,
): ShortcutResult
/**
 * React hook for one cleanup-safe shortcut binding.
 *
 * @param binding - Object containing `keys`, `handler`, and optional per-binding `options`
 * @param shortcutOptions - Hook-level options such as `target`, `eventType`, and `activeScopes`
 * @returns A stable `ShortcutResult` handle. Before the effect runs, the handle is disabled and uses the provided keys as its display text.
 *
 * @example
 * ```ts
 * const closeShortcut = useShortcutBinding({
 *   keys: ["escape", "mod+d"],
 *   handler: closeDialog,
 *   options: { description: "Close dialog" },
 * })
 * ```
 */
export function useShortcutBinding(
    binding: ShortcutBinding,
    shortcutOptions?: UseShortcutOptions,
): ShortcutResult
export function useShortcutBinding(
    keysOrBinding: ShortcutBinding["keys"] | ShortcutBinding,
    handlerOrShortcutOptions?: ShortcutHandler | UseShortcutOptions,
    handlerOptions?: HandlerOptions,
    shortcutOptions?: UseShortcutOptions,
): ShortcutResult {
    const { binding, shortcutOptions: normalizedShortcutOptions } = _normalizeShortcutBindingArgs(
        keysOrBinding,
        handlerOrShortcutOptions,
        handlerOptions,
        shortcutOptions,
    )
    const $ = useShortcut(normalizedShortcutOptions)

    const handlerRef = useRef(binding.handler)
    handlerRef.current = binding.handler

    const stableKeysRef = useRef(binding.keys)
    if (!_areShortcutMapKeysEqual(stableKeysRef.current, binding.keys)) {
        stableKeysRef.current = binding.keys
    }
    const stableKeys = stableKeysRef.current

    const stableOptionsRef = useRef(binding.options)
    if (!_areHandlerOptionsEqual(stableOptionsRef.current, binding.options)) {
        stableOptionsRef.current = binding.options
    }
    const stableOptions = stableOptionsRef.current

    const resultRef = useRef<ShortcutResult>(_createPendingShortcutResult(binding.keys))
    const stableResultRef = useRef<ShortcutResult | null>(null)
    if (!stableResultRef.current) {
        stableResultRef.current = _createDelegatingShortcutResult(resultRef)
    }

    useEffect(() => {
        const registrations = registerShortcutMap($, {
            current: {
                keys: stableKeys,
                handler: (event) => handlerRef.current(event),
                options: stableOptions,
            },
        })

        resultRef.current = registrations.current

        return () => {
            registrations.current.unbind()
            resultRef.current = _createPendingShortcutResult(stableKeys)
        }
    }, [$, stableKeys, stableOptions])

    return stableResultRef.current
}

/**
 * React hook that registers a shortcut map and automatically unbinds on cleanup.
 *
 * Handlers are kept in a ref, so inline handler functions never cause
 * re-registration. The returned map and its per-id results are stable object
 * references, safe to destructure at any point in the component lifecycle.
 *
 * @param shortcutMap - Record of action ids to key bindings, handlers, and options
 * @param options - Same options as `useShortcut()`
 * @returns A map of `ShortcutResult` keyed by your shortcut ids
 *
 * @example
 * ```ts
 * const { save, close } = useShortcutMap({
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

    const handlersRef = useRef<Record<string, ShortcutHandler>>({})
    handlersRef.current = {}
    for (const id of Object.keys(shortcutMap)) {
        handlersRef.current[id] = shortcutMap[id].handler
    }

    const stableShortcutMapRef = useRef(shortcutMap)
    if (!_areShortcutMapsEquivalent(stableShortcutMapRef.current, shortcutMap)) {
        stableShortcutMapRef.current = shortcutMap
    }
    const stableShortcutMap = stableShortcutMapRef.current

    const sourcesRef = useRef(new Map<string, { current: ShortcutResult }>())
    const delegatesRef = useRef({} as Record<string, ShortcutResult>)

    for (const id of Object.keys(stableShortcutMap)) {
        if (!sourcesRef.current.has(id)) {
            const source = { current: _createPendingShortcutResult(stableShortcutMap[id].keys) }
            sourcesRef.current.set(id, source)
            delegatesRef.current[id] = _createDelegatingShortcutResult(source)
        }
    }

    for (const id of Object.keys(delegatesRef.current)) {
        if (!stableShortcutMap[id]) {
            sourcesRef.current.delete(id)
            delete delegatesRef.current[id]
        }
    }

    useEffect(() => {
        const wrappedMap = {} as ShortcutMap
        for (const id of Object.keys(stableShortcutMap)) {
            wrappedMap[id] = {
                keys: stableShortcutMap[id].keys,
                handler: (event) => handlersRef.current[id]?.(event),
                options: stableShortcutMap[id].options,
            }
        }

        const registrations = registerShortcutMap($, wrappedMap)

        for (const id of Object.keys(registrations)) {
            const source = sourcesRef.current.get(id)
            if (source) source.current = registrations[id]
        }

        return () => {
            for (const id of Object.keys(registrations)) {
                registrations[id].unbind()
                const source = sourcesRef.current.get(id)
                if (source) {
                    source.current = _createPendingShortcutResult(stableShortcutMap[id]?.keys ?? "")
                }
            }
        }
    }, [$, stableShortcutMap])

    return delegatesRef.current as ShortcutMapResult<T>
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
