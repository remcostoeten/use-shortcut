import { detectPlatform, Platform } from "./constants"
import type {
    ActionKey,
    HandlerOptions,
    ShortcutBuilder as IShortcutBuilder,
    ShortcutScope,
    UseShortcutOptions,
    ExceptPreset,
    ExceptPredicate,
    ShortcutHandler,
} from "./types"

import { _createBinding } from "./runtime/binding"
import { _debugLog } from "./runtime/debug"
import { _normalizeScopes } from "./runtime/guards"
import { _buildComboString } from "./runtime/keys"
import { _createRecorder } from "./runtime/recording"
import type { BuilderState, ShortcutRegistry } from "./runtime/types"

const MODIFIER_KEYS = new Set(["ctrl", "shift", "alt", "cmd", "mod"])

export function _createShortcutBuilder(options: UseShortcutOptions = {}): {
    builder: IShortcutBuilder
    registry: ShortcutRegistry
} {
    const registry: ShortcutRegistry = {
        listeners: new Map(),
        firstStepIndex: new Map(),
        activeSequenceCombos: new Set(),
        options,
        activeScopes: new Set(_normalizeScopes(options.activeScopes)),
        nextId: 1,
        listener: null,
        listenerTarget: null,
        listenerEventType: options.eventType ?? "keydown",
    }

    _debugLog(options.debug, "Builder created with options:", options)

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

                    _debugLog(currentState.options.debug, `Chain: +${prop} →`, newState.modifiers)

                    return createProxy(newState)
                }

                if (prop === "in") {
                    return (scopes: ShortcutScope) => {
                        const nextScopes = [..._normalizeScopes(currentState.scopes), ..._normalizeScopes(scopes)]
                        const newState: BuilderState = {
                            ...currentState,
                            scopes: nextScopes,
                        }

                        return createProxy(newState)
                    }
                }

                if (prop === "setScopes") {
                    return (scopes: ShortcutScope) => {
                        registry.activeScopes = new Set(_normalizeScopes(scopes))
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
                    return _createRecorder(registry.options)
                }

                if (prop === "key") {
                    return (key: ActionKey) => {
                        const nextStep = _buildComboString(currentState.modifiers, key)
                        const newState: BuilderState = {
                            ...currentState,
                            modifiers: {},
                            steps: [...currentState.steps, nextStep],
                        }

                        _debugLog(currentState.options.debug, `Chain: .key("${key}")`)

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

                        _debugLog(currentState.options.debug, `Chain: .then("${nextStep}")`)

                        return createProxy(newState)
                    }
                }

                if (prop === "except") {
                    return (condition: ExceptPreset | ExceptPreset[] | ExceptPredicate) => {
                        const newState: BuilderState = {
                            ...currentState,
                            except: condition,
                        }

                        _debugLog(currentState.options.debug, "Chain: .except()", condition)

                        return createProxy(newState)
                    }
                }

                if (prop === "on") {
                    return (handler: ShortcutHandler, handlerOptions?: HandlerOptions) => {
                        return _createBinding(currentState, handler, handlerOptions, registry)
                    }
                }

                if (prop === "handle") {
                    return (opts: HandlerOptions & { handler: ShortcutHandler }) => {
                        const { handler, ...rest } = opts
                        return _createBinding(currentState, handler, rest, registry)
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
