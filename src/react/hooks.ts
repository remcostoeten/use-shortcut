import { useEffect, useMemo, useRef, useSyncExternalStore } from "react"
import { displayCombo, formatCombo } from "../registry/combo"
import type {
    BindingDefinition,
    BindingInfo,
    Handle,
    Handler,
    Registry,
} from "../registry/registry"
import type { Nullable } from "../shared/types/semantic"
import { useRegion } from "./context"
import type { Region } from "./context"

type ListStore = {
    subscribe: (listener: () => void) => () => void
    read: () => readonly BindingInfo[]
}

const EMPTY_LIST: readonly BindingInfo[] = []

function emptyList(): readonly BindingInfo[] {
    return EMPTY_LIST
}

function disabled(): boolean {
    return false
}

function definitionKey(definition: BindingDefinition): string {
    return JSON.stringify([
        definition.steps,
        definition.scopes,
        definition.except,
        definition.allowInInputs,
        definition.priority,
        definition.description,
    ])
}

function createListStore(region: Region): ListStore {
    let version = -1
    let cached: readonly BindingInfo[] = EMPTY_LIST
    return {
        subscribe: region.registry.subscribe,
        read: () => {
            if (version !== region.version()) {
                version = region.version()
                cached = region.registry.list()
            }
            return cached
        },
    }
}

/**
 * @name useRegistry
 * @description Returns the registry of the nearest `ShortcutProvider`, for scope switching and
 * registering bindings outside `useBinding`. Throws outside a provider.
 *
 * @example
 * const registry = useRegistry()
 * registry.enable("editing")
 */
export function useRegistry(): Registry {
    return useRegion().registry
}

/**
 * @name useBinding
 * @description Registers a binding in the nearest provider for the lifetime of the component. The
 * latest `handler` always runs, and re-renders never re-register as long as the definition's steps,
 * scopes, except names, allowInInputs, priority and description stay the same. The returned handle's
 * `combo` and `display` are ready on the first render; the other members forward to the live
 * binding once it is registered.
 *
 * @example
 * const handle = useBinding({ steps: [{ kind: "press", key: "k", modifiers: ["mod"] }] }, open)
 * <kbd>{handle.display}</kbd>
 */
export function useBinding(definition: BindingDefinition, handler: Handler): Handle {
    const region = useRegion()
    const handlerRef = useRef(handler)
    const definitionRef = useRef(definition)
    const liveRef = useRef<Nullable<Handle>>(null)
    const key = definitionKey(definition)
    const combo = formatCombo(definition.steps)
    const display = displayCombo(definition.steps, region.platform)

    useEffect(() => {
        handlerRef.current = handler
        definitionRef.current = definition
    })

    useSyncExternalStore(
        region.registry.subscribe,
        () => liveRef.current?.isEnabled() ?? false,
        disabled,
    )

    useEffect(() => {
        const handle = region.registry.add(definitionRef.current, (event) =>
            handlerRef.current(event),
        )
        liveRef.current = handle
        region.notify()
        return () => {
            handle.unbind()
            liveRef.current = null
        }
    }, [region, key])

    return useMemo<Handle>(
        () => ({
            get id() {
                return liveRef.current?.id ?? ""
            },
            combo,
            display,
            isEnabled: () => liveRef.current?.isEnabled() ?? false,
            enable: () => liveRef.current?.enable(),
            disable: () => liveRef.current?.disable(),
            unbind: () => liveRef.current?.unbind(),
            trigger: () => liveRef.current?.trigger(),
        }),
        [combo, display],
    )
}

/**
 * @name useShortcutList
 * @description Returns the active bindings of the nearest provider for help screens, and re-renders
 * whenever a binding is added, removed, enabled or disabled or a scope changes.
 *
 * @example
 * const bindings = useShortcutList()
 * bindings.map((binding) => <li key={binding.id}>{binding.display}</li>)
 */
export function useShortcutList(): readonly BindingInfo[] {
    const region = useRegion()
    const store = useMemo(() => createListStore(region), [region])
    return useSyncExternalStore(store.subscribe, store.read, emptyList)
}
