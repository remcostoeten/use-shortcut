import { createDriver } from "../browser/driver"
import type { Driver, ListenTarget } from "../browser/driver"
import { shouldSkip } from "../browser/target"
import type { ExceptRule } from "../browser/target"
import { createMatcher } from "../core/matcher"
import type { Fired, MatcherOptions } from "../core/matcher"
import type { StepInput } from "../core/step"
import { throwInDev, warnInDev } from "../shared/helpers/dev"
import { elementOf } from "../shared/helpers/dom"
import { detectHost, detectPlatform } from "../shared/helpers/environment"
import type {
    BindingID,
    Combo,
    HoldPhase,
    Host,
    Milliseconds,
    Nullable,
    Platform,
    Priority,
    Scope,
} from "../shared/types/semantic"
import { displayCombo, formatCombo } from "./combo"

/** What a press handler receives. `event` is null when time or `trigger()` fired the binding. */
export type PressEvent = {
    combo: Combo
    event: Nullable<KeyboardEvent>
}

/** What a hold handler receives: `start` at the threshold, `release` on keyup. */
export type HoldEvent = {
    combo: Combo
    phase: HoldPhase
    duration: Milliseconds
}

export type ShortcutEvent = PressEvent | HoldEvent
export type Handler = (event: ShortcutEvent) => void

export type BindingDefinition = {
    steps: readonly StepInput[]
    scopes?: readonly Scope[]
    except?: readonly ExceptRule[]
    allowInInputs?: boolean
    priority?: Priority
    description?: string
}

/** Controls one registered binding. */
export type Handle = {
    id: BindingID
    combo: Combo
    display: string
    isEnabled: () => boolean
    enable: () => void
    disable: () => void
    unbind: () => void
    trigger: () => void
}

/** A read-only view of a binding for help screens. */
export type BindingInfo = {
    id: BindingID
    combo: Combo
    display: string
    description: string
    scopes: readonly Scope[]
    enabled: boolean
}

export type RegistryOptions = {
    platform?: Platform
    host?: Host
    scopes?: readonly Scope[]
    sequenceTimeout?: Milliseconds
    holdThreshold?: Milliseconds
    target?: ListenTarget
}

export type Registry = {
    add: (definition: BindingDefinition, handler: Handler) => Handle
    enable: (scope: Scope) => void
    disable: (scope: Scope) => void
    isEnabled: (scope: Scope) => boolean
    list: () => readonly BindingInfo[]
    subscribe: (listener: () => void) => () => void
    interrupt: () => void
    destroy: () => void
}

type Binding = {
    id: BindingID
    definition: BindingDefinition
    handler: Handler
    combo: Combo
    enabled: boolean
}

const HOSTS: ReadonlySet<Scope> = new Set<Host>(["web", "desktop"])

const BROWSER_COMBOS: ReadonlySet<Combo> = new Set([
    "mod+w",
    "mod+t",
    "mod+n",
    "mod+q",
    "mod+shift+t",
    "mod+shift+n",
    "mod+shift+w",
    "ctrl+tab",
    "ctrl+shift+tab",
    "mod+l",
])

function shareScope(a: readonly Scope[], b: readonly Scope[]): boolean {
    if (a.length === 0 || b.length === 0) return true
    return a.some((scope) => b.includes(scope))
}

function isKeyboardTarget(event: Nullable<KeyboardEvent>): Nullable<EventTarget> {
    return event ? event.target : document.activeElement
}

function deadHandle(id: BindingID, combo: Combo): Handle {
    return {
        id,
        combo,
        display: "",
        isEnabled: () => false,
        enable: () => {},
        disable: () => {},
        unbind: () => {},
        trigger: () => {},
    }
}

function toEvent(binding: Binding, fired: Fired, event: Nullable<KeyboardEvent>): ShortcutEvent {
    if (fired.type === "hold") {
        return { combo: binding.combo, phase: fired.phase, duration: fired.duration }
    }
    return { combo: binding.combo, event }
}

/**
 * @name createRegistry
 * @description The plain JavaScript API. Holds bindings, switches scopes on and off, rebuilds the
 * matcher when the active set changes and runs handlers when the browser driver reports a match.
 * Scopes listed in `scopes` start enabled; of the built-in `web` and `desktop` scopes only the
 * detected host starts enabled.
 *
 * @example
 * const shortcuts = createRegistry({ scopes: ["app"] })
 * const handle = shortcuts.add(
 *     { steps: [{ kind: "press", key: "k", modifiers: ["mod"] }], scopes: ["app"] },
 *     () => openPalette(),
 * )
 * handle.display // "⌘K" on a Mac
 */
export function createRegistry(options: RegistryOptions = {}): Registry {
    const platform = options.platform ?? detectPlatform()
    const host = options.host ?? detectHost()
    const matcherOptions: MatcherOptions = {
        platform,
        ...(options.sequenceTimeout !== undefined && { sequenceTimeout: options.sequenceTimeout }),
        ...(options.holdThreshold !== undefined && { holdThreshold: options.holdThreshold }),
    }
    const bindings = new Map<BindingID, Binding>()
    const active = new Set<Scope>([...(options.scopes ?? []), host])
    const listeners = new Set<() => void>()
    const mutedHolds = new Set<BindingID>()
    let nextId = 0

    function isActive(binding: Binding): boolean {
        const scopes = binding.definition.scopes ?? []
        return binding.enabled && (scopes.length === 0 || scopes.some((scope) => active.has(scope)))
    }

    function activeBindings(): Binding[] {
        return [...bindings.values()].filter(isActive)
    }

    function skipOptions(binding: Binding) {
        return {
            except: binding.definition.except ?? [],
            allowInInputs: binding.definition.allowInInputs ?? false,
        }
    }

    function build() {
        return createMatcher(
            activeBindings().map((binding) => ({
                id: binding.id,
                steps: binding.definition.steps,
            })),
            matcherOptions,
        )
    }

    function allows(binding: Binding, hit: Fired, target: Nullable<EventTarget>): boolean {
        if (hit.type === "hold" && hit.phase === "release") return !mutedHolds.delete(binding.id)
        if (!shouldSkip(target, skipOptions(binding))) return true
        if (hit.type === "hold") mutedHolds.add(binding.id)
        return false
    }

    function onFired(fired: readonly Fired[], event: Nullable<KeyboardEvent>): boolean {
        const target = isKeyboardTarget(event)
        const hits = fired.flatMap((hit) => {
            const binding = bindings.get(hit.binding)
            if (!binding || !isActive(binding)) return []
            return allows(binding, hit, target) ? [{ binding, hit }] : []
        })
        const top = Math.max(...hits.map(({ binding }) => binding.definition.priority ?? 0))
        hits.filter(({ binding }) => (binding.definition.priority ?? 0) === top).forEach(
            ({ binding, hit }) => binding.handler(toEvent(binding, hit, event)),
        )
        return hits.length > 0
    }

    function shouldPrevent(holds: readonly BindingID[], event: KeyboardEvent): boolean {
        return holds.some((id) => {
            const binding = bindings.get(id)
            return (
                binding !== undefined &&
                isActive(binding) &&
                !shouldSkip(elementOf(event.target), skipOptions(binding))
            )
        })
    }

    function shouldHandle(event: KeyboardEvent): boolean {
        return activeBindings().some(
            (binding) => !shouldSkip(elementOf(event.target), skipOptions(binding)),
        )
    }

    const driver: Driver = createDriver({
        matcher: build(),
        onFired,
        shouldHandle,
        shouldPrevent,
        ...(options.target && { target: options.target }),
    })

    function refresh() {
        driver.setMatcher(build())
        listeners.forEach((listener) => listener())
    }

    function warnAbout(binding: Binding) {
        const scopes = binding.definition.scopes ?? []
        const twin = [...bindings.values()].find(
            (other) =>
                other !== binding &&
                other.combo === binding.combo &&
                shareScope(scopes, other.definition.scopes ?? []),
        )
        if (twin) warnInDev(`use-shortcut: "${binding.combo}" is bound twice in the same scope`)
        if (host === "web" && BROWSER_COMBOS.has(binding.combo)) {
            warnInDev(`use-shortcut: browsers keep "${binding.combo}", it may never reach the page`)
        }
    }

    function add(definition: BindingDefinition, handler: Handler): Handle {
        nextId += 1
        const id: BindingID = `binding-${nextId}`
        const binding: Binding = {
            id,
            definition,
            handler,
            combo: formatCombo(definition.steps),
            enabled: true,
        }
        try {
            createMatcher([{ id, steps: definition.steps }], matcherOptions)
        } catch (error) {
            throwInDev(error instanceof Error ? error.message : String(error))
            return deadHandle(id, binding.combo)
        }
        bindings.set(id, binding)
        refresh()
        warnAbout(binding)
        return {
            id,
            combo: binding.combo,
            display: displayCombo(definition.steps, platform),
            isEnabled: () => binding.enabled,
            enable: () => {
                binding.enabled = true
                refresh()
            },
            disable: () => {
                binding.enabled = false
                refresh()
            },
            unbind: () => {
                bindings.delete(id)
                refresh()
            },
            trigger: () => {
                if (!binding.enabled) return
                const first = definition.steps[0]
                const fired: Fired =
                    first?.kind === "hold"
                        ? { type: "hold", binding: id, phase: "start", duration: 0 }
                        : { type: "press", binding: id }
                handler(toEvent(binding, fired, null))
            },
        }
    }

    return {
        add,
        enable: (scope) => {
            if (HOSTS.has(scope)) HOSTS.forEach((other) => active.delete(other))
            active.add(scope)
            refresh()
        },
        disable: (scope) => {
            active.delete(scope)
            refresh()
        },
        isEnabled: (scope) => active.has(scope),
        list: () =>
            activeBindings().map((binding) => ({
                id: binding.id,
                combo: binding.combo,
                display: displayCombo(binding.definition.steps, platform),
                description: binding.definition.description ?? "",
                scopes: binding.definition.scopes ?? [],
                enabled: binding.enabled,
            })),
        subscribe: (listener) => {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
        interrupt: driver.interrupt,
        destroy: driver.destroy,
    }
}
