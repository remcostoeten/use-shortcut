import {
    detectPlatform,
    Platform,
    ModifierKey,
    ModifierDisplayOrder,
} from "./constants"
import { formatShortcut } from "./formatter"
import { parseShortcut, matchesShortcut } from "./parser"
import type {
    ActionKey,
    ModifierFlags,
    ShortcutHandler,
    HandlerOptions,
    ShortcutResult,
    UseShortcutOptions,
    ExceptPreset,
    ExceptPredicate,
    ShortcutBuilder as IShortcutBuilder,
    ShortcutScope,
    ShortcutConflict,
    ParsedShortcut,
    ShortcutRecordingOptions,
} from "./types"

const MODIFIER_KEYS = new Set(["ctrl", "shift", "alt", "cmd", "mod"])
const IGNORED_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"])

const EXCEPT_PREDICATES: Record<ExceptPreset, ExceptPredicate> = {
    input: (e) => {
        const target = e.target as HTMLElement
        return IGNORED_TAGS.has(target.tagName)
    },
    editable: (e) => {
        const target = e.target as HTMLElement
        return target.isContentEditable
    },
    typing: (e) => {
        const target = e.target as HTMLElement
        return IGNORED_TAGS.has(target.tagName) || target.isContentEditable
    },
    modal: () => {
        return document.querySelector('[data-modal="true"], [role="dialog"]') !== null
    },
    disabled: (e) => {
        const target = e.target as HTMLElement
        return target.hasAttribute("disabled") || target.getAttribute("aria-disabled") === "true"
    },
}

function shouldExcept(event: KeyboardEvent, except?: ExceptPreset | ExceptPreset[] | ExceptPredicate): boolean {
    if (!except) return false

    if (typeof except === "function") {
        return except(event)
    }

    if (Array.isArray(except)) {
        return except.some((preset) => EXCEPT_PREDICATES[preset]?.(event))
    }

    return EXCEPT_PREDICATES[except]?.(event) ?? false
}

type BuilderState = {
    modifiers: Partial<ModifierFlags>
    steps: string[]
    options: UseShortcutOptions
    except?: ExceptPreset | ExceptPreset[] | ExceptPredicate
    scopes?: ShortcutScope
}

type RegistryEntry = {
    id: number
    userHandler: ShortcutHandler
    isEnabled: boolean
    attemptCallbacks: Set<(matched: boolean, event: KeyboardEvent) => void>
    parsedSteps: ParsedShortcut[]
    scopes: Set<string>
    progress: number
    lastMatchedAt: number
    except?: ExceptPreset | ExceptPreset[] | ExceptPredicate
    delay: number
    sequenceTimeout: number
    preventDefault: boolean
    stopPropagation: boolean
    stopOnMatch: boolean
    priority: number
}

type ShortcutRegistry = {
    listeners: Map<string, RegistryEntry[]>
    firstStepIndex: Map<string, Set<string>>
    activeSequenceCombos: Set<string>
    options: UseShortcutOptions
    activeScopes: Set<string>
    nextId: number
    listener: ((event: KeyboardEvent) => void) | null
    listenerTarget: (HTMLElement | Window) | null
    listenerEventType: "keydown" | "keyup"
}

function normalizeScopes(scopes?: ShortcutScope): string[] {
    if (!scopes) return []
    return (Array.isArray(scopes) ? scopes : [scopes])
        .map((scope) => scope.trim())
        .filter(Boolean)
}

function scopeMatch(requiredScopes: Set<string>, activeScopes: Set<string>): boolean {
    if (requiredScopes.size === 0) return true
    for (const required of requiredScopes) {
        if (activeScopes.has(required)) return true
    }
    return false
}

function getActiveModifierTokens(modifiers: Partial<ModifierFlags>): string[] {
    const platform = detectPlatform()
    const order = ModifierDisplayOrder[platform]

    return order
        .filter((key) => {
            if (key === ModifierKey.CTRL) return modifiers.ctrl
            if (key === ModifierKey.ALT) return modifiers.alt
            if (key === ModifierKey.SHIFT) return modifiers.shift
            if (key === ModifierKey.META) return modifiers.cmd
            return false
        })
        .map((key) => {
            if (key === ModifierKey.CTRL) return "ctrl"
            if (key === ModifierKey.ALT) return "alt"
            if (key === ModifierKey.SHIFT) return "shift"
            if (key === ModifierKey.META) return "cmd"
            return ""
        })
}

function buildComboString(modifiers: Partial<ModifierFlags>, key: string): string {
    const tokens = getActiveModifierTokens(modifiers)
    return [...tokens, key].join("+")
}

function formatSequenceDisplay(steps: string[]): string {
    return steps.map((step) => formatShortcut(step)).join(" then ")
}

function debugLog(debug: boolean | undefined, ...args: unknown[]) {
    if (debug) {
        console.log("[useShortcut]", ...args)
    }
}

function normalizeKeyToken(key: string): string {
    return key === " " ? "space" : key.toLowerCase()
}

function canonicalizeParsed(parsed: ParsedShortcut): string {
    const modifiers: string[] = []
    if (parsed.modifiers.ctrl) modifiers.push("ctrl")
    if (parsed.modifiers.alt) modifiers.push("alt")
    if (parsed.modifiers.shift) modifiers.push("shift")
    if (parsed.modifiers.meta) modifiers.push("cmd")
    return [...modifiers, normalizeKeyToken(parsed.key)].join("+")
}

function isPureModifier(event: KeyboardEvent): boolean {
    const key = event.key.toLowerCase()
    return key === "shift" || key === "control" || key === "alt" || key === "meta"
}

function eventToCombo(event: KeyboardEvent): string {
    const modifiers: string[] = []
    if (event.ctrlKey) modifiers.push("ctrl")
    if (event.altKey) modifiers.push("alt")
    if (event.shiftKey) modifiers.push("shift")
    if (event.metaKey) modifiers.push("cmd")

    const key = normalizeKeyToken(event.key)
    return [...modifiers, key].join("+")
}

function eventToMatchStep(event: KeyboardEvent): string {
    const modifiers: string[] = []
    if (event.ctrlKey) modifiers.push("ctrl")
    if (event.altKey) modifiers.push("alt")
    if (event.shiftKey) modifiers.push("shift")
    if (event.metaKey) modifiers.push("cmd")
    const key = normalizeKeyToken(event.key)
    return [...modifiers, key].join("+")
}

function isPrefix(a: ParsedShortcut[], b: ParsedShortcut[]): boolean {
    if (a.length > b.length) return false
    for (let i = 0; i < a.length; i += 1) {
        if (canonicalizeParsed(a[i]) !== canonicalizeParsed(b[i])) {
            return false
        }
    }
    return true
}

function detectConflict(newSteps: ParsedShortcut[], existingSteps: ParsedShortcut[]): ShortcutConflict["reason"] | null {
    const newCombo = newSteps.map(canonicalizeParsed).join(" ")
    const existingCombo = existingSteps.map(canonicalizeParsed).join(" ")

    if (newCombo === existingCombo) return "exact"
    if (isPrefix(newSteps, existingSteps) || isPrefix(existingSteps, newSteps)) {
        return "sequence-prefix"
    }

    return null
}

function emitConflict(registry: ShortcutRegistry, conflict: ShortcutConflict) {
    const conflictWarnings = registry.options.conflictWarnings ?? true

    if (registry.options.onConflict) {
        registry.options.onConflict(conflict)
        return
    }

    if (!conflictWarnings) return

    console.warn(
        `[useShortcut] Conflict detected (${conflict.reason}) between "${conflict.combo}" and "${conflict.existingCombo}"`,
    )
}

function sortEntries(entries: RegistryEntry[]): RegistryEntry[] {
    return [...entries].sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority
        return a.id - b.id
    })
}

function dispatchRegistryEvent(registry: ShortcutRegistry, event: KeyboardEvent) {
    const runtimeOptions = registry.options
    if (runtimeOptions.disabled) return
    if (runtimeOptions.eventFilter && !runtimeOptions.eventFilter(event)) return

    const candidateCombos = new Set<string>()
    const firstStepCombos = registry.firstStepIndex.get(eventToMatchStep(event))
    if (firstStepCombos) {
        for (const combo of firstStepCombos) candidateCombos.add(combo)
    }
    for (const combo of registry.activeSequenceCombos) {
        candidateCombos.add(combo)
    }

    for (const combo of candidateCombos) {
        const comboEntries = registry.listeners.get(combo)
        if (!comboEntries) continue

        const orderedEntries = sortEntries(comboEntries)

        for (const item of orderedEntries) {
            if (!item.isEnabled) continue

            if (!scopeMatch(item.scopes, registry.activeScopes)) {
                continue
            }

            if (runtimeOptions.ignoreInputs !== false && !item.except) {
                const targetEl = event.target as HTMLElement
                if (targetEl && (IGNORED_TAGS.has(targetEl.tagName) || targetEl.isContentEditable)) {
                    continue
                }
            }

            if (shouldExcept(event, item.except)) {
                debugLog(runtimeOptions.debug, "Skipped due to except condition:", combo)
                continue
            }

            const now = Date.now()

            if (item.progress > 0 && now - item.lastMatchedAt > item.sequenceTimeout) {
                item.progress = 0
            }

            const expected = item.parsedSteps[item.progress]

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

            for (const cb of item.attemptCallbacks) {
                cb(matched, event)
            }

            if (!matched) continue

            debugLog(runtimeOptions.debug, "MATCHED:", combo)

            if (item.preventDefault) {
                event.preventDefault()
            }

            if (item.stopPropagation) {
                event.stopPropagation()
            }

            const executeHandler = () => item.userHandler(event)

            if (item.delay > 0) {
                debugLog(runtimeOptions.debug, "Delaying execution by", item.delay, "ms")
                setTimeout(executeHandler, item.delay)
            } else {
                executeHandler()
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
}

function attachRegistryListener(registry: ShortcutRegistry) {
    if (registry.listener) return

    const target = registry.options.target ?? (typeof window !== "undefined" ? window : null)
    if (!target) return

    const eventType = registry.options.eventType ?? "keydown"
    const listener = (event: KeyboardEvent) => dispatchRegistryEvent(registry, event)
    target.addEventListener(eventType, listener as EventListener)

    registry.listener = listener
    registry.listenerTarget = target
    registry.listenerEventType = eventType

    debugLog(registry.options.debug, "Listener attached")
}

function detachRegistryListener(registry: ShortcutRegistry) {
    if (!registry.listener || !registry.listenerTarget) return

    registry.listenerTarget.removeEventListener(registry.listenerEventType, registry.listener as EventListener)
    registry.listener = null
    registry.listenerTarget = null
    debugLog(registry.options.debug, "Listener detached")
}

function createBinding(
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
    const combo = parsedSteps.map(canonicalizeParsed).join(" ")
    const display = formatSequenceDisplay(rawSteps)
    const debug = options.debug ?? false
    const except = stateExcept ?? handlerOptions.except

    for (const [existingCombo, entries] of registry.listeners.entries()) {
        for (const existing of entries) {
            if (existingCombo === combo) continue
            const reason = detectConflict(parsedSteps, existing.parsedSteps)
            if (!reason) continue
            emitConflict(registry, { combo, existingCombo, reason })
        }
    }

    const isEnabled = !handlerOptions.disabled && !options.disabled
    const delay = handlerOptions.delay ?? options.delay ?? 0
    const sequenceTimeout = handlerOptions.sequenceTimeout ?? options.sequenceTimeout ?? 800
    const requiredScopes = new Set(normalizeScopes(state.scopes ?? handlerOptions.scopes))
    const attemptCallbacks = new Set<(matched: boolean, event: KeyboardEvent) => void>()

    debugLog(debug, "Registering:", combo, "→", display, {
        parsedSteps,
        except: !!except,
        scopes: [...requiredScopes],
    })

    const entry: RegistryEntry = {
        id: registry.nextId++,
        userHandler: handler,
        isEnabled,
        attemptCallbacks,
        parsedSteps,
        scopes: requiredScopes,
        progress: 0,
        lastMatchedAt: 0,
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

        const firstStep = canonicalizeParsed(parsedSteps[0])
        const indexedCombos = registry.firstStepIndex.get(firstStep)
        if (indexedCombos) {
            indexedCombos.add(combo)
        } else {
            registry.firstStepIndex.set(firstStep, new Set([combo]))
        }
    }

    attachRegistryListener(registry)

    const unbindEntry = () => {
        const currentEntries = registry.listeners.get(combo)
        if (!currentEntries) return

        const nextEntries = currentEntries.filter((item) => item.id !== entry.id)

        if (nextEntries.length === 0) {
            registry.listeners.delete(combo)
            registry.activeSequenceCombos.delete(combo)

            const firstStep = canonicalizeParsed(parsedSteps[0])
            const indexedCombos = registry.firstStepIndex.get(firstStep)
            if (indexedCombos) {
                indexedCombos.delete(combo)
                if (indexedCombos.size === 0) {
                    registry.firstStepIndex.delete(firstStep)
                }
            }

            debugLog(debug, "Unregistered:", combo)
        } else {
            registry.listeners.set(combo, nextEntries)
        }

        if (registry.listeners.size === 0) {
            detachRegistryListener(registry)
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

function createRecorder(options: UseShortcutOptions) {
    return (recordingOptions: ShortcutRecordingOptions = {}): Promise<string> => {
        return new Promise((resolve, reject) => {
            const target = recordingOptions.target ?? options.target ?? (typeof window !== "undefined" ? window : null)
            const eventType = recordingOptions.eventType ?? options.eventType ?? "keydown"

            if (!target) {
                reject(new Error("[useShortcut] Cannot record shortcut without a target."))
                return
            }

            let timeout: ReturnType<typeof setTimeout> | undefined

            const listener = (event: Event) => {
                const keyboardEvent = event as KeyboardEvent
                if (isPureModifier(keyboardEvent)) return

                keyboardEvent.preventDefault()
                target.removeEventListener(eventType, listener as EventListener)
                if (timeout) clearTimeout(timeout)
                resolve(eventToCombo(keyboardEvent))
            }

            target.addEventListener(eventType, listener as EventListener, { once: false })

            const timeoutMs = recordingOptions.timeoutMs
            if (timeoutMs && timeoutMs > 0) {
                timeout = setTimeout(() => {
                    target.removeEventListener(eventType, listener as EventListener)
                    reject(new Error(`[useShortcut] Recording timed out after ${timeoutMs}ms.`))
                }, timeoutMs)
            }
        })
    }
}

export function _createShortcutBuilder(options: UseShortcutOptions = {}): {
    builder: IShortcutBuilder
    registry: ShortcutRegistry
} {
    const registry: ShortcutRegistry = {
        listeners: new Map(),
        firstStepIndex: new Map(),
        activeSequenceCombos: new Set(),
        options,
        activeScopes: new Set(normalizeScopes(options.activeScopes)),
        nextId: 1,
        listener: null,
        listenerTarget: null,
        listenerEventType: options.eventType ?? "keydown",
    }

    debugLog(options.debug, "Builder created with options:", options)

    function createProxy(currentState: BuilderState): IShortcutBuilder {
        return new Proxy({} as IShortcutBuilder, {
            get(_, prop: string) {
                if (prop === "__debug") {
                    return currentState.options.debug
                }

                if (MODIFIER_KEYS.has(prop)) {
                    const platform = detectPlatform()
                    const modKey = prop === "mod" ? (platform === Platform.MAC ? "cmd" : "ctrl") : prop

                    const newState: BuilderState = {
                        ...currentState,
                        modifiers: { ...currentState.modifiers, [modKey]: true },
                    }

                    debugLog(currentState.options.debug, `Chain: +${prop} →`, newState.modifiers)

                    return createProxy(newState)
                }

                if (prop === "in") {
                    return (scopes: ShortcutScope) => {
                        const nextScopes = [...normalizeScopes(currentState.scopes), ...normalizeScopes(scopes)]
                        const newState: BuilderState = {
                            ...currentState,
                            scopes: nextScopes,
                        }

                        return createProxy(newState)
                    }
                }

                if (prop === "setScopes") {
                    return (scopes: ShortcutScope) => {
                        registry.activeScopes = new Set(normalizeScopes(scopes))
                    }
                }

                if (prop === "enableScope") {
                    return (scope: string) => {
                        if (!scope?.trim()) return
                        registry.activeScopes.add(scope.trim())
                    }
                }

                if (prop === "disableScope") {
                    return (scope: string) => {
                        if (!scope?.trim()) return
                        registry.activeScopes.delete(scope.trim())
                    }
                }

                if (prop === "getScopes") {
                    return () => [...registry.activeScopes]
                }

                if (prop === "isScopeActive") {
                    return (scope: string) => registry.activeScopes.has(scope)
                }

                if (prop === "record") {
                    return createRecorder(registry.options)
                }

                if (prop === "key") {
                    return (key: ActionKey) => {
                        const nextStep = buildComboString(currentState.modifiers, key)
                        const newState: BuilderState = {
                            ...currentState,
                            modifiers: {},
                            steps: [...currentState.steps, nextStep],
                        }

                        debugLog(currentState.options.debug, `Chain: .key("${key}")`)

                        return createProxy(newState)
                    }
                }

                if (prop === "then") {
                    return (key: ActionKey | string) => {
                        const nextStep = String(key).trim().toLowerCase()
                        if (!nextStep) {
                            throw new Error("[useShortcut] .then() requires a non-empty key or shortcut step.")
                        }

                        const newState: BuilderState = {
                            ...currentState,
                            steps: [...currentState.steps, nextStep],
                        }

                        debugLog(currentState.options.debug, `Chain: .then("${nextStep}")`)

                        return createProxy(newState)
                    }
                }

                if (prop === "except") {
                    return (condition: ExceptPreset | ExceptPreset[] | ExceptPredicate) => {
                        const newState: BuilderState = {
                            ...currentState,
                            except: condition,
                        }

                        debugLog(currentState.options.debug, "Chain: .except()", condition)

                        return createProxy(newState)
                    }
                }

                if (prop === "on") {
                    return (handler: ShortcutHandler, handlerOptions?: HandlerOptions) => {
                        return createBinding(currentState, handler, handlerOptions, registry)
                    }
                }

                if (prop === "handle") {
                    return (opts: HandlerOptions & { handler: ShortcutHandler }) => {
                        const { handler, ...rest } = opts
                        return createBinding(currentState, handler, rest, registry)
                    }
                }

                return undefined
            },
        })
    }

    const initialState: BuilderState = {
        modifiers: {},
        steps: [],
        options,
    }

    return {
        builder: createProxy(initialState),
        registry,
    }
}
