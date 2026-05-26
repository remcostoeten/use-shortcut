import type { HandlerOptions } from "@remcostoeten/use-shortcut/react"
import type { ShortcutScope } from "./scopes"

export type ShortcutDefinition = {
    description: string
    defaultKeys: string | string[]
    scopes: ShortcutScope[]
    options?: Omit<HandlerOptions, "scopes">
}

export const shortcutRegistry = {
    openCommandPalette: {
        description: "Open global command palette",
        defaultKeys: "mod+k",
        scopes: ["global", "navigation"],
    },
    saveDocument: {
        description: "Save the active editor document",
        defaultKeys: "mod+s",
        scopes: ["editor"],
    },
    goDashboard: {
        description: "Navigate to dashboard (vim style sequence)",
        defaultKeys: ["g", "d"],
        scopes: ["navigation"],
    },
    closeOverlay: {
        description: "Close active overlay",
        defaultKeys: "escape",
        scopes: ["global", "modal"],
    },
} as const satisfies Record<string, ShortcutDefinition>

export type ShortcutActionId = keyof typeof shortcutRegistry
export type ShortcutBindings = Record<ShortcutActionId, string | string[]>
