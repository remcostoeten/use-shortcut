import { matchesShortcut } from "../parser"

import { _buildAttemptSteps, _createDebugInput, _debugLog, _deriveAttemptStatus, _logDebugEvent, _shouldLogDebug } from "./debug"
import { _eventToMatchStep } from "./keys"
import { _IGNORED_TAGS, _scopeMatch, _shouldExcept } from "./guards"
import type { RegistryEntry, ShortcutRegistry } from "./types"
import type { ShortcutAttemptDebugEvent, ShortcutDebugEvent } from "../types"

function _dispatchRegistryEvent(registry: ShortcutRegistry, event: KeyboardEvent) {
    const runtimeOptions = registry.options
    if (runtimeOptions.disabled) return
    if (runtimeOptions.eventFilter && !runtimeOptions.eventFilter(event)) return

    const inputCombo = _eventToMatchStep(event)
    const includeAllForDebug =
        registry.debugListeners.size > 0 ||
        _shouldLogDebug(runtimeOptions.debug) ||
        registry.attemptCallbackCount > 0

    const firstStepCombos = registry.firstStepIndex.get(inputCombo)

    if (!includeAllForDebug && !firstStepCombos && registry.activeSequenceCombos.size === 0) {
        return
    }

    const debugInput = includeAllForDebug ? _createDebugInput(event, inputCombo) : null
    const attempts: ShortcutAttemptDebugEvent[] = []

    const candidateCombos = new Set<string>()
    if (firstStepCombos) {
        for (const combo of firstStepCombos) candidateCombos.add(combo)
    }
    for (const combo of registry.activeSequenceCombos) {
        candidateCombos.add(combo)
    }
    if (includeAllForDebug) {
        for (const combo of registry.listeners.keys()) {
            candidateCombos.add(combo)
        }
    }

    for (const combo of candidateCombos) {
        const comboEntries = registry.listeners.get(combo)
        if (!comboEntries) continue

        for (const item of comboEntries) {
            if (!item.isEnabled) continue

            if (!_scopeMatch(item.scopes, registry.activeScopes)) {
                continue
            }

            if (runtimeOptions.ignoreInputs !== false && !item.except) {
                const targetEl = event.target as HTMLElement
                if (targetEl && (_IGNORED_TAGS.has(targetEl.tagName) || targetEl.isContentEditable)) {
                    continue
                }
            }

            if (_shouldExcept(event, item.except)) {
                _debugLog(runtimeOptions.debug, "Skipped due to except condition:", combo)
                continue
            }

            const expected = item.parsedSteps[item.progress]
            const now = Date.now()

            if (item.progress > 0 && now - item.lastMatchedAt > item.sequenceTimeout) {
                item.progress = 0
            }
            if (debugInput && item.debugHistory.length > 0 && now - item.lastDebugAt > item.sequenceTimeout) {
                item.debugHistory = []
            }

            const stepIndex = item.progress
            let matched = false

            if (matchesShortcut(event, expected)) {
                item.progress += 1
                item.lastMatchedAt = now

                if (item.progress === item.parsedSteps.length) {
                    matched = true
                    item.progress = 0
                }
            } else if (item.progress > 0 && matchesShortcut(event, item.parsedSteps[0])) {
                item.progress = 1
                item.lastMatchedAt = now
            } else {
                item.progress = 0
            }

            if (debugInput) {
                item.lastDebugAt = now
                item.debugHistory.push(inputCombo)
                if (item.debugHistory.length > item.expectedSteps.length) {
                    item.debugHistory.shift()
                }

                const actualSteps = item.debugHistory.slice(-item.expectedSteps.length)
                const steps = _buildAttemptSteps(item.expectedSteps, actualSteps, matched)
                const details: ShortcutAttemptDebugEvent = {
                    combo: item.combo,
                    display: item.display,
                    description: item.description,
                    status: _deriveAttemptStatus(steps, item.expectedSteps.length, actualSteps.length, matched),
                    matched,
                    progress: item.progress,
                    expectedSteps: item.expectedSteps,
                    actualSteps,
                    stepIndex,
                    input: debugInput,
                    steps,
                }

                attempts.push(details)

                for (const cb of item.attemptCallbacks) {
                    cb(matched, event, details)
                }
            }

            if (!matched) continue

            _debugLog(runtimeOptions.debug, "MATCHED:", combo)

            if (item.preventDefault) {
                event.preventDefault()
            }

            if (item.stopPropagation) {
                event.stopPropagation()
            }

            const executeHandler = () => {
                item.timeoutIds.delete(timeoutId)
                if (!item.isEnabled) return
                if (!registry.listeners.get(item.combo)?.some((entry) => entry.id === item.id)) return
                item.userHandler(event)
            }
            let timeoutId: ReturnType<typeof setTimeout>

            if (item.delay > 0) {
                _debugLog(runtimeOptions.debug, "Delaying execution by", item.delay, "ms")
                timeoutId = setTimeout(executeHandler, item.delay)
                item.timeoutIds.add(timeoutId)
            } else {
                item.userHandler(event)
            }

            if (item.stopOnMatch) {
                break
            }
        }

        if (comboEntries.some((entry) => entry.progress > 0)) {
            registry.activeSequenceCombos.add(combo)
        } else {
            registry.activeSequenceCombos.delete(combo)
        }
    }

    if (!debugInput) return

    const debugEvent: ShortcutDebugEvent = {
        input: debugInput,
        attempts,
    }

    if (registry.debugListeners.size > 0) {
        for (const listener of registry.debugListeners) {
            listener(debugEvent)
        }
    }

    _logDebugEvent(runtimeOptions.debug, debugEvent)
}

export function _attachRegistryListener(registry: ShortcutRegistry) {
    const target = registry.options.target ?? (typeof window !== "undefined" ? window : null)
    if (!target) return

    const eventType = registry.options.eventType ?? "keydown"
    if (registry.listener) {
        if (registry.listenerTarget === target && registry.listenerEventType === eventType) return
        _detachRegistryListener(registry)
    }

    const listener = (event: KeyboardEvent) => _dispatchRegistryEvent(registry, event)
    target.addEventListener(eventType, listener as EventListener)

    registry.listener = listener
    registry.listenerTarget = target
    registry.listenerEventType = eventType

    _debugLog(registry.options.debug, "Listener attached")
}

export function _detachRegistryListener(registry: ShortcutRegistry) {
    if (!registry.listener || !registry.listenerTarget) return

    registry.listenerTarget.removeEventListener(registry.listenerEventType, registry.listener as EventListener)
    registry.listener = null
    registry.listenerTarget = null
    _debugLog(registry.options.debug, "Listener detached")
}
