import { parseShortcut } from "../parser"
import type { HandlerOptions, ShortcutAttemptDebugEvent, ShortcutHandler, ShortcutResult } from "../types"

import { _debugLog } from "./debug"
import { _detectConflict, _emitConflict } from "./conflicts"
import { _canonicalizeParsed, _formatSequenceDisplay } from "./keys"
import { _normalizeScopes } from "./guards"
import { _attachRegistryListener, _detachRegistryListener } from "./listener"
import type { BuilderState, RegistryEntry, ShortcutRegistry } from "./types"

export function _createBinding(
    state: BuilderState,
    handler: ShortcutHandler,
    handlerOptions: HandlerOptions = {},
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

    for (const [existingCombo, entries] of registry.listeners.entries()) {
        for (const existing of entries) {
            if (existingCombo === combo) continue
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
    }

    const comboEntries = registry.listeners.get(combo)
    if (comboEntries) {
        comboEntries.push(entry)
    } else {
        registry.listeners.set(combo, [entry])

        const firstStep = _canonicalizeParsed(parsedSteps[0])
        const indexedCombos = registry.firstStepIndex.get(firstStep)
        if (indexedCombos) {
            indexedCombos.add(combo)
        } else {
            registry.firstStepIndex.set(firstStep, new Set([combo]))
        }
    }

    _attachRegistryListener(registry)

    const unbindEntry = () => {
        const currentEntries = registry.listeners.get(combo)
        if (!currentEntries) return

        const nextEntries = currentEntries.filter((item) => item.id !== entry.id)

        if (nextEntries.length === 0) {
            registry.listeners.delete(combo)
            registry.activeSequenceCombos.delete(combo)

            const firstStep = _canonicalizeParsed(parsedSteps[0])
            const indexedCombos = registry.firstStepIndex.get(firstStep)
            if (indexedCombos) {
                indexedCombos.delete(combo)
                if (indexedCombos.size === 0) {
                    registry.firstStepIndex.delete(firstStep)
                }
            }

            _debugLog(debug, "Unregistered:", combo)
        } else {
            registry.listeners.set(combo, nextEntries)
        }

        if (registry.listeners.size === 0) {
            _detachRegistryListener(registry)
        }
    }

    return {
        unbind: unbindEntry,
        display,
        combo,
        trigger: () => handler(new KeyboardEvent(registry.options.eventType ?? "keydown")),
        get isEnabled() {
            return entry.isEnabled
        },
        enable: () => {
            entry.isEnabled = true
        },
        disable: () => {
            entry.isEnabled = false
        },
        onAttempt: (callback) => {
            entry.attemptCallbacks.add(callback)
            return () => entry.attemptCallbacks.delete(callback)
        },
    }
}
