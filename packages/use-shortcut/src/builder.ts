import { detectPlatform, Platform } from "./constants"
import type {
    ActionKey,
    HandlerOptions,
    ShortcutBuilder as IShortcutBuilder,
    ShortcutDebugEvent,
    ShortcutScope,
    UseShortcutOptions,
    ExceptPreset,
    ExceptPredicate,
    ShortcutHandler,
    ShortcutRecordingOptions,
} from "./types"

import { _createBinding } from "./runtime/binding"
import { _debugLog } from "./runtime/debug"
import { _normalizeScopes } from "./runtime/guards"
import { _attachRegistryListener } from "./runtime/listener"
import { _buildComboString } from "./runtime/keys"
import { _createRecorder } from "./runtime/recording"
import type { BuilderState, ShortcutRegistry } from "./runtime/types"

type ModifierProp = "ctrl" | "shift" | "alt" | "cmd" | "mod"

export function _createShortcutBuilder(options: UseShortcutOptions = {}): {
    builder: IShortcutBuilder
    registry: ShortcutRegistry
} {
    let registryOptions = options
    const registry: ShortcutRegistry = {
        listeners: new Map(),
        firstStepIndex: new Map(),
        activeSequenceCombos: new Set(),
        get options() {
            return registryOptions
        },
        set options(nextOptions) {
            registryOptions = nextOptions
            if (registry.listenerTarget && registry.listeners.size > 0) {
                _attachRegistryListener(registry)
            }
        },
        activeScopes: new Set(_normalizeScopes(options.activeScopes)),
        nextId: 1,
        debugListeners: new Set(),
        attemptCallbackCount: 0,
        listenerTarget: null,
        listenerEventType: options.eventType ?? "keydown",
        pendingRecordings: new Set(),
        collectingRenderBindings: false,
        renderCycle: 0,
        nextRenderSlot: 0,
        renderSlots: new Map(),
    }

    _debugLog(options.debug, "Builder created with options:", options)

    const record = _createRecorder(registry)

    function _withModifier(currentState: BuilderState, prop: ModifierProp): IShortcutBuilder {
        const platform = detectPlatform()
        const modKey = prop === "mod" ? (platform === Platform.MAC ? "cmd" : "ctrl") : prop

        const newState: BuilderState = {
            ...currentState,
            modifiers: { ...currentState.modifiers, [modKey]: true },
        }

        _debugLog(currentState.options.debug, `Chain: +${prop} →`, newState.modifiers)

        return _createChain(newState)
    }

    function _createChain(currentState: BuilderState): IShortcutBuilder {
        const chain = {
            get ctrl() {
                return _withModifier(currentState, "ctrl")
            },
            get shift() {
                return _withModifier(currentState, "shift")
            },
            get alt() {
                return _withModifier(currentState, "alt")
            },
            get cmd() {
                return _withModifier(currentState, "cmd")
            },
            get mod() {
                return _withModifier(currentState, "mod")
            },
            in: (scopes: ShortcutScope) => {
                const nextScopes = [..._normalizeScopes(currentState.scopes), ..._normalizeScopes(scopes)]
                return _createChain({ ...currentState, scopes: nextScopes })
            },
            setScopes: (scopes: ShortcutScope) => {
                registry.activeScopes = new Set(_normalizeScopes(scopes))
            },
            enableScope: (scope: string) => {
                if (!scope?.trim()) return
                registry.activeScopes.add(scope.trim())
            },
            disableScope: (scope: string) => {
                if (!scope?.trim()) return
                registry.activeScopes.delete(scope.trim())
            },
            getScopes: () => [...registry.activeScopes],
            isScopeActive: (scope: string) => registry.activeScopes.has(scope),
            onDebug: (callback: (event: ShortcutDebugEvent) => void) => {
                registry.debugListeners.add(callback)
                return () => registry.debugListeners.delete(callback)
            },
            record: (recordingOptions?: ShortcutRecordingOptions) => record(recordingOptions),
            key: (key: ActionKey) => {
                const nextStep = _buildComboString(currentState.modifiers, key)
                const newState: BuilderState = {
                    ...currentState,
                    modifiers: {},
                    boundCombos: undefined,
                    steps: [...currentState.steps, nextStep],
                }

                _debugLog(currentState.options.debug, `Chain: .key("${key}")`)

                return _createChain(newState)
            },
            bind: (combo: string | string[]) => {
                const combos = Array.isArray(combo) ? combo : [combo]
                const newState: BuilderState = {
                    ...currentState,
                    modifiers: {},
                    boundCombos: combos,
                    steps: combos,
                }

                _debugLog(currentState.options.debug, `Chain: .bind("${combos.join('", "')}")`)

                return _createChain(newState)
            },
            then: (key: ActionKey | string) => {
                const nextStep = String(key).trim().toLowerCase()
                if (!nextStep) {
                    throw new Error("[useShortcut] .then() requires a non-empty key or shortcut step.")
                }

                const newState: BuilderState = {
                    ...currentState,
                    boundCombos: undefined,
                    steps: [...currentState.steps, nextStep],
                }

                _debugLog(currentState.options.debug, `Chain: .then("${nextStep}")`)

                return _createChain(newState)
            },
            except: (condition: ExceptPreset | ExceptPreset[] | ExceptPredicate) => {
                _debugLog(currentState.options.debug, "Chain: .except()", condition)

                return _createChain({ ...currentState, except: condition })
            },
            on: (handler: ShortcutHandler, handlerOptions?: HandlerOptions) => {
                return _createBinding(currentState, handler, handlerOptions, registry)
            },
            handle: (opts: HandlerOptions & { handler: ShortcutHandler }) => {
                const { handler, ...rest } = opts
                return _createBinding(currentState, handler, rest, registry)
            },
        }

        return chain as unknown as IShortcutBuilder
    }

    const initialState: BuilderState = {
        modifiers: {},
        steps: [],
        options,
    }

    return {
        builder: _createChain(initialState),
        registry,
    }
}
