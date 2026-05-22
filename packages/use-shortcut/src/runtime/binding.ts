import { parseShortcut } from "../parser"
import type { HandlerOptions, ShortcutAttemptDebugEvent, ShortcutHandler, ShortcutResult } from "../types"

import { _debugLog } from "./debug"
import { _detectConflict, _emitConflict } from "./conflicts"
import { _canonicalizeParsed, _formatSequenceDisplay } from "./keys"
import { _normalizeScopes } from "./guards"
import { _attachRegistryListener, _detachRegistryListener } from "./listener"
import type { BuilderState, RegistryEntry, ShortcutRegistry } from "./types"

function _clearEntryTimeouts(entry: RegistryEntry) {
    for (const timeoutId of entry.timeoutIds) {
        clearTimeout(timeoutId)
    }
    entry.timeoutIds.clear()
}

export function _removeRegistryEntry(registry: ShortcutRegistry, entry: RegistryEntry) {
    const currentEntries = registry.listeners.get(entry.combo)
    if (!currentEntries) return

    _clearEntryTimeouts(entry)

    const nextEntries = currentEntries.filter((item) => item.id !== entry.id)

    if (nextEntries.length === 0) {
        registry.listeners.delete(entry.combo)
        registry.activeSequenceCombos.delete(entry.combo)

        const firstStep = _canonicalizeParsed(entry.parsedSteps[0])
        const indexedCombos = registry.firstStepIndex.get(firstStep)
        if (indexedCombos) {
            indexedCombos.delete(entry.combo)
            if (indexedCombos.size === 0) {
                registry.firstStepIndex.delete(firstStep)
            }
        }
    } else {
        registry.listeners.set(entry.combo, nextEntries)
    }

    if (entry.renderSlot !== undefined && registry.renderSlots.get(entry.renderSlot)?.id === entry.id) {
        registry.renderSlots.delete(entry.renderSlot)
    }

    if (registry.listeners.size === 0) {
        _detachRegistryListener(registry)
    }
}

function _addRegistryEntry(registry: ShortcutRegistry, entry: RegistryEntry) {
    const comboEntries = registry.listeners.get(entry.combo)
    if (comboEntries) {
        comboEntries.push(entry)
        return
    }

    registry.listeners.set(entry.combo, [entry])

    const firstStep = _canonicalizeParsed(entry.parsedSteps[0])
    const indexedCombos = registry.firstStepIndex.get(firstStep)
    if (indexedCombos) {
        indexedCombos.add(entry.combo)
    } else {
        registry.firstStepIndex.set(firstStep, new Set([entry.combo]))
    }
}

function _updateRegistryEntry(
    entry: RegistryEntry,
    next: Omit<RegistryEntry, "id" | "attemptCallbacks" | "timeoutIds" | "renderSlot" | "lastSeenRenderCycle">,
) {
    _clearEntryTimeouts(entry)
    entry.userHandler = next.userHandler
    entry.isEnabled = next.isEnabled
    entry.combo = next.combo
    entry.display = next.display
    entry.description = next.description
    entry.parsedSteps = next.parsedSteps
    entry.expectedSteps = next.expectedSteps
    entry.scopes = next.scopes
    entry.progress = next.progress
    entry.lastMatchedAt = next.lastMatchedAt
    entry.debugHistory = next.debugHistory
    entry.lastDebugAt = next.lastDebugAt
    entry.except = next.except
    entry.delay = next.delay
    entry.sequenceTimeout = next.sequenceTimeout
    entry.preventDefault = next.preventDefault
    entry.stopPropagation = next.stopPropagation
    entry.stopOnMatch = next.stopOnMatch
    entry.priority = next.priority
}

function _createResult(entry: RegistryEntry, registry: ShortcutRegistry): ShortcutResult {
    return {
        unbind: () => _removeRegistryEntry(registry, entry),
        get display() {
            return entry.display
        },
        get combo() {
            return entry.combo
        },
        trigger: () => entry.userHandler(new KeyboardEvent(registry.options.eventType ?? "keydown")),
        get isEnabled() {
            return entry.isEnabled
        },
        enable: () => {
            entry.isEnabled = true
        },
        disable: () => {
            entry.isEnabled = false
            _clearEntryTimeouts(entry)
        },
        onAttempt: (callback) => {
            entry.attemptCallbacks.add(callback)
            return () => entry.attemptCallbacks.delete(callback)
        },
    }
}

function _registerBinding(
    state: BuilderState,
    handler: ShortcutHandler,
    handlerOptions: HandlerOptions,
    registry: ShortcutRegistry,
): ShortcutResult {
    const { options, except: stateExcept } = state

    const rawSteps = state.steps

    if (rawSteps.length === 0) {
        throw new Error('[useShortcut] No key specified. Use .key() to set the action key.')
    }

    const parsedSteps = rawSteps.map((step) => parseShortcut(step))
    const combo = parsedSteps.map(_canonicalizeParsed).join(" ")
    const display = _formatSequenceDisplay(rawSteps)
    const debug = options.debug ?? false
    const except = stateExcept ?? handlerOptions.except

    const renderSlot = registry.reconcileRenderBindings ? registry.nextRenderSlot++ : undefined
    const existingRenderEntry = renderSlot === undefined ? undefined : registry.renderSlots.get(renderSlot)

    if (existingRenderEntry && existingRenderEntry.combo !== combo) {
        _removeRegistryEntry(registry, existingRenderEntry)
    }

    const ignoredConflictId = existingRenderEntry?.combo === combo ? existingRenderEntry.id : undefined

    for (const [existingCombo, entries] of registry.listeners.entries()) {
        for (const existing of entries) {
            if (existing.id === ignoredConflictId) continue
            const reason = _detectConflict(parsedSteps, existing.parsedSteps)
            if (!reason) continue
            _emitConflict(registry, { combo, existingCombo, reason })
        }
    }

    const isEnabled = !handlerOptions.disabled && !options.disabled
    const delay = handlerOptions.delay ?? options.delay ?? 0
    const sequenceTimeout = handlerOptions.sequenceTimeout ?? options.sequenceTimeout ?? 800
    const requiredScopes = new Set(_normalizeScopes(state.scopes ?? handlerOptions.scopes))
    const expectedSteps = parsedSteps.map(_canonicalizeParsed)
    const attemptCallbacks = new Set<(matched: boolean, event: KeyboardEvent, details?: ShortcutAttemptDebugEvent) => void>()

    _debugLog(debug, "Registering:", combo, "→", display, {
        parsedSteps,
        except: !!except,
        scopes: [...requiredScopes],
    })

    const entry: RegistryEntry = {
        id: registry.nextId++,
        userHandler: handler,
        isEnabled,
        combo,
        display,
        description: handlerOptions.description,
        attemptCallbacks,
        parsedSteps,
        expectedSteps,
        scopes: requiredScopes,
        progress: 0,
        lastMatchedAt: 0,
        debugHistory: [],
        lastDebugAt: 0,
        except,
        delay,
        sequenceTimeout,
        preventDefault: handlerOptions.preventDefault !== false,
        stopPropagation: handlerOptions.stopPropagation ?? false,
        stopOnMatch: handlerOptions.stopOnMatch ?? false,
        priority: handlerOptions.priority ?? 0,
        timeoutIds: existingRenderEntry?.combo === combo ? existingRenderEntry.timeoutIds : new Set(),
        renderSlot,
        lastSeenRenderCycle: registry.reconcileRenderBindings ? registry.renderCycle : undefined,
    }

    if (existingRenderEntry && existingRenderEntry.combo === combo) {
        _updateRegistryEntry(existingRenderEntry, entry)
        existingRenderEntry.lastSeenRenderCycle = registry.renderCycle
        return _createResult(existingRenderEntry, registry)
    }

    _addRegistryEntry(registry, entry)

    if (renderSlot !== undefined) {
        registry.renderSlots.set(renderSlot, entry)
    }

    if (!registry.reconcileRenderBindings || !registry.collectingRenderBindings) {
        _attachRegistryListener(registry)
    }

    return _createResult(entry, registry)
}

export function _createBinding(
    state: BuilderState,
    handler: ShortcutHandler,
    handlerOptions: HandlerOptions = {},
    registry: ShortcutRegistry,
): ShortcutResult {
    const boundCombos = state.boundCombos?.filter((combo) => combo.trim())

    if (!boundCombos || boundCombos.length <= 1) {
        return _registerBinding(state, handler, handlerOptions, registry)
    }

    const results = boundCombos.map((combo) => {
        const boundState: BuilderState = {
            ...state,
            boundCombos: [combo],
            steps: [combo],
        }

        return _registerBinding(boundState, handler, handlerOptions, registry)
    })

    return {
        unbind: () => {
            for (const result of results) {
                result.unbind()
            }
        },
        display: results.map((result) => result.display).join(" / "),
        combo: results.map((result) => result.combo).join(" | "),
        trigger: () => {
            for (const result of results) {
                result.trigger()
            }
        },
        get isEnabled() {
            return results.some((result) => result.isEnabled)
        },
        enable: () => {
            for (const result of results) {
                result.enable()
            }
        },
        disable: () => {
            for (const result of results) {
                result.disable()
            }
        },
        onAttempt: (callback) => {
            const removers = results
                .map((result) => result.onAttempt?.(callback))
                .filter((remove): remove is () => void => Boolean(remove))

            return () => {
                for (const remove of removers) {
                    remove()
                }
            }
        },
    }
}
