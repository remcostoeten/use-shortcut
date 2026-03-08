import type { ShortcutMap } from "@remcostoeten/use-shortcut"
import { shortcutRegistry, type ShortcutActionId, type ShortcutBindings } from "./registry"
import type { ShortcutHandlers } from "./types"

/**
 * Returns a fresh binding object seeded from `shortcutRegistry` defaults.
 *
 * @returns Default shortcut bindings for every registered action
 */
export function createDefaultShortcutBindings(): ShortcutBindings {
    const bindings = {} as ShortcutBindings

    for (const actionId of Object.keys(shortcutRegistry) as ShortcutActionId[]) {
        bindings[actionId] = shortcutRegistry[actionId].defaultKeys
    }

    return bindings
}

/**
 * Builds a `ShortcutMap` by combining current bindings with action handlers.
 * Actions without handlers are skipped.
 *
 * @param bindings - Current binding state (defaults + user overrides)
 * @param handlers - Runtime action handlers from the consuming app
 * @returns Runtime shortcut map consumable by `registerShortcutMap`
 */
export function buildShortcutMap(bindings: ShortcutBindings, handlers: ShortcutHandlers): ShortcutMap {
    const map: ShortcutMap = {}

    for (const actionId of Object.keys(shortcutRegistry) as ShortcutActionId[]) {
        const definition = shortcutRegistry[actionId]
        const handler = handlers[actionId]

        if (!handler) {
            continue
        }

        map[actionId] = {
            keys: bindings[actionId],
            handler,
            options: {
                ...definition.options,
                scopes: definition.scopes,
                description: definition.description,
            },
        }
    }

    return map
}
