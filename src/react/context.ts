import { createContext, useContext } from "react"
import { createRegistry } from "../registry/registry"
import type { BindingInfo, Registry, RegistryOptions } from "../registry/registry"
import type { Combo, Nullable, Platform } from "../shared/types/semantic"
import { forwardKey } from "./events"

/** One provider's state: the live registry once mounted, and the facade handed to hooks. */
export type Region = {
    parent: Nullable<Region>
    platform: Platform
    tree: Set<Registry>
    registry: Registry
    live: () => Nullable<Registry>
    version: () => number
    notify: () => void
    inherit: () => readonly Combo[]
    setInherit: (combos: readonly Combo[]) => void
    mount: (options: RegistryOptions) => () => void
    handle: (event: KeyboardEvent) => void
}

export const RegionContext = createContext<Nullable<Region>>(null)

const EMPTY_LIST: readonly BindingInfo[] = []

const NOT_MOUNTED =
    "use-shortcut: the ShortcutProvider has not mounted yet, call this from an effect or an event handler"

const claimed = new WeakSet<KeyboardEvent>()

/**
 * @name createRegion
 * @description Builds the state behind one `ShortcutProvider`. The registry it exposes is a facade
 * that is safe to hand out during render and on the server: reads answer empty until the provider
 * mounts, writes throw a clear error, and subscriptions survive the registry being created later.
 * `mount` creates the real registry listening on a detached element, `handle` feeds a key event
 * into it, interrupting every other region in the tree on keydown, and `notify` wakes subscribers.
 *
 * @example
 * const region = createRegion(null, "mac")
 * const unmount = region.mount({ scopes: ["app"] })
 */
export function createRegion(parent: Nullable<Region>, platform: Platform): Region {
    const tree: Set<Registry> = parent?.tree ?? new Set()
    const listeners = new Set<() => void>()
    let live: Nullable<Registry> = null
    let proxy: Nullable<HTMLElement> = null
    let version = 0
    let inherit: readonly Combo[] = []

    function notify() {
        version += 1
        listeners.forEach((listener) => listener())
    }

    function mounted(): Registry {
        if (live === null) throw new Error(NOT_MOUNTED)
        return live
    }

    function interruptOthers() {
        tree.forEach((other) => {
            if (other !== live) other.interrupt()
        })
    }

    const registry: Registry = {
        add: (definition, handler) => mounted().add(definition, handler),
        enable: (scope) => mounted().enable(scope),
        disable: (scope) => mounted().disable(scope),
        isEnabled: (scope) => live?.isEnabled(scope) ?? false,
        list: () => live?.list() ?? EMPTY_LIST,
        subscribe: (listener) => {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
        interrupt: () => live?.interrupt(),
        destroy: () => live?.destroy(),
    }

    const region: Region = {
        parent,
        platform,
        tree,
        registry,
        live: () => live,
        version: () => version,
        notify,
        inherit: () => inherit,
        setInherit: (combos) => {
            inherit = combos
        },
        mount: (options) => {
            const element = document.createElement("div")
            const created = createRegistry({ ...options, platform, target: element })
            const unsubscribe = created.subscribe(notify)
            proxy = element
            live = created
            tree.add(created)
            notify()
            return () => {
                unsubscribe()
                tree.delete(created)
                created.destroy()
                live = null
                proxy = null
                notify()
            }
        },
        handle: (event) => {
            if (proxy === null) return
            if (event.type === "keydown" && !claimed.has(event)) {
                claimed.add(event)
                interruptOthers()
            }
            forwardKey(event, proxy)
        },
    }
    return region
}

/**
 * @name useRegion
 * @description Reads the nearest provider's region and throws a clear error when there is none.
 *
 * @example
 * const region = useRegion()
 */
export function useRegion(): Region {
    const region = useContext(RegionContext)
    if (region === null) {
        throw new Error(
            "use-shortcut: shortcut.on() was called outside a <ShortcutProvider>. Wrap your app in the ShortcutProvider returned by createShortcuts().",
        )
    }
    return region
}
