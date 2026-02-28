import {
    detectPlatform,
    Platform,
    ModifierDisplaySymbols,
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
    listener: (e: KeyboardEvent) => void
    userHandler: ShortcutHandler
    unbind: () => void
    isEnabled: boolean
    attemptCallbacks: Set<(matched: boolean, event: KeyboardEvent) => void>
    parsedSteps: ParsedShortcut[]
    scopes: Set<string>
    progress: number
    lastMatchedAt: number
}

type ShortcutRegistry = {
    listeners: Map<string, RegistryEntry>
    options: UseShortcutOptions
    activeScopes: Set<string>
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

function canonicalizeParsed(parsed: ParsedShortcut): string {
    const modifiers: string[] = []
    if (parsed.modifiers.ctrl) modifiers.push("ctrl")
    if (parsed.modifiers.alt) modifiers.push("alt")
    if (parsed.modifiers.shift) modifiers.push("shift")
    if (parsed.modifiers.meta) modifiers.push("cmd")
    return [...modifiers, parsed.key.toLowerCase()].join("+")
}

function isPureModifier(event: KeyboardEvent): boolean {
    const key = event.key.toLowerCase()
    return key === "shift" || key === "control" || key === "alt" || key === "meta"
}

function eventToCombo(event: KeyboardEvent): string {
    const platform = detectPlatform()
    const symbols = ModifierDisplaySymbols[platform]

    const modifiers: string[] = []
    if (event.ctrlKey) modifiers.push(symbols[ModifierKey.CTRL] === "⌃" ? "ctrl" : "ctrl")
    if (event.altKey) modifiers.push("alt")
    if (event.shiftKey) modifiers.push("shift")
    if (event.metaKey) modifiers.push("cmd")

    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase()
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

    for (const [existingCombo, existing] of registry.listeners.entries()) {
        if (existingCombo === combo) continue
        const reason = detectConflict(parsedSteps, existing.parsedSteps)
        if (!reason) continue
        emitConflict(registry, { combo, existingCombo, reason })
    }

    const existing = registry.listeners.get(combo)
    if (existing) {
        debugLog(debug, "Updating existing shortcut handler:", combo)
        existing.userHandler = handler
        existing.scopes = new Set(normalizeScopes(state.scopes ?? handlerOptions.scopes))
        return {
            unbind: existing.unbind,
            display,
            combo,
            trigger: () => existing.userHandler(new KeyboardEvent("keydown")),
            get isEnabled() {
                return existing.isEnabled
            },
            enable: () => {
                existing.isEnabled = true
            },
            disable: () => {
                existing.isEnabled = false
            },
            onAttempt: (callback) => {
                existing.attemptCallbacks.add(callback)
                return () => existing.attemptCallbacks.delete(callback)
            },
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

    function handleEvent(event: KeyboardEvent) {
        const entry = registry.listeners.get(combo)
        if (!entry?.isEnabled) return

        const runtimeOptions = registry.options
        if (runtimeOptions.disabled) return

        if (!scopeMatch(entry.scopes, registry.activeScopes)) {
            return
        }

        if (runtimeOptions.ignoreInputs !== false && !except) {
            const target = event.target as HTMLElement
            if (target && (IGNORED_TAGS.has(target.tagName) || target.isContentEditable)) {
                return
            }
        }

        if (shouldExcept(event, except)) {
            debugLog(debug, "Skipped due to except condition:", combo)
            return
        }

        const expected = entry.parsedSteps[entry.progress]
        const now = Date.now()

        if (entry.progress > 0 && now - entry.lastMatchedAt > sequenceTimeout) {
            entry.progress = 0
        }

        let matched = false

        if (matchesShortcut(event, expected)) {
            entry.progress += 1
            entry.lastMatchedAt = now

            if (entry.progress === entry.parsedSteps.length) {
                matched = true
                entry.progress = 0
            }
        } else if (entry.progress > 0 && matchesShortcut(event, entry.parsedSteps[0])) {
            entry.progress = 1
            entry.lastMatchedAt = now
        } else {
            entry.progress = 0
        }

        entry.attemptCallbacks.forEach((cb) => cb(matched, event))

        if (!matched) return

        debugLog(debug, "MATCHED:", combo, "→", display)

        if (handlerOptions.preventDefault !== false) {
            event.preventDefault()
        }

        if (handlerOptions.stopPropagation) {
            event.stopPropagation()
        }

        const executeHandler = () => entry.userHandler(event)

        if (delay > 0) {
            debugLog(debug, "Delaying execution by", delay, "ms")
            setTimeout(executeHandler, delay)
        } else {
            executeHandler()
        }
    }

    const target = options.target ?? (typeof window !== "undefined" ? window : null)
    const eventType = options.eventType ?? "keydown"

    if (target) {
        target.addEventListener(eventType, handleEvent as EventListener)
        debugLog(debug, "Listener attached for:", combo)
    }

    function unbind() {
        if (target) {
            target.removeEventListener(eventType, handleEvent as EventListener)
            registry.listeners.delete(combo)
            debugLog(debug, "Unregistered:", combo)
        }
    }

    registry.listeners.set(combo, {
        listener: handleEvent,
        userHandler: handler,
        unbind,
        isEnabled,
        attemptCallbacks,
        parsedSteps,
        scopes: requiredScopes,
        progress: 0,
        lastMatchedAt: 0,
    })

    return {
        unbind,
        display,
        combo,
        trigger: () => handler(new KeyboardEvent(eventType)),
        get isEnabled() {
            return registry.listeners.get(combo)?.isEnabled ?? false
        },
        enable: () => {
            const entry = registry.listeners.get(combo)
            if (entry) entry.isEnabled = true
        },
        disable: () => {
            const entry = registry.listeners.get(combo)
            if (entry) entry.isEnabled = false
        },
        onAttempt: (callback) => {
            const entry = registry.listeners.get(combo)
            if (entry) {
                entry.attemptCallbacks.add(callback)
                return () => entry.attemptCallbacks.delete(callback)
            }
            return () => { }
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

export function createShortcutBuilder(options: UseShortcutOptions = {}): {
    builder: IShortcutBuilder
    registry: ShortcutRegistry
} {
    const registry: ShortcutRegistry = {
        listeners: new Map(),
        options,
        activeScopes: new Set(normalizeScopes(options.activeScopes)),
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
