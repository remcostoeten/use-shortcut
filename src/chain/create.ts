import { createRegistry } from "../registry/registry"
import type { Registry, RegistryOptions } from "../registry/registry"
import type { Scope } from "../shared/types/semantic"
import { createChain } from "./chain"
import type { Shortcut } from "./stages"

type Props<S extends readonly Scope[]> = Omit<RegistryOptions, "scopes"> & { scopes?: S }

export type Shortcuts<S extends readonly Scope[]> = {
    shortcut: Shortcut<S[number]>
    registry: Registry
}

/**
 * @name createShortcuts
 * @description The plain JavaScript entry: one registry listening on the window plus the typed
 * chain over it. Call it once per app. React apps use `createShortcuts` from the `react` entry
 * instead, which binds through hooks.
 *
 * @example
 * const { shortcut, registry } = createShortcuts({ scopes: ["app"] })
 * const palette = shortcut.mod.key("k").in("app").on(openPalette)
 * registry.enable("app")
 */
export function createShortcuts<const S extends readonly Scope[] = []>(
    options: Props<S> = {},
): Shortcuts<S> {
    const registry = createRegistry(options)
    const scopes: S | readonly [] = options.scopes ?? []
    return { shortcut: createChain(scopes, registry.add), registry }
}
