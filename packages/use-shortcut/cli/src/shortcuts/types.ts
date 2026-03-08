import type { ShortcutActionId, ShortcutBindings } from "./registry"
import type { ShortcutScope } from "./scopes"

export type ShortcutHandlers = Record<ShortcutActionId, (event: KeyboardEvent) => void>

export type ShortcutState = {
    activeScopes: ShortcutScope[]
    bindings: ShortcutBindings
    enabled: boolean
}

export type ShortcutActions = {
    setScopes: (scopes: ShortcutScope | ShortcutScope[]) => void
    enableScope: (scope: ShortcutScope) => void
    disableScope: (scope: ShortcutScope) => void
    setBinding: (actionId: ShortcutActionId, keys: string | string[]) => void
    resetBinding: (actionId: ShortcutActionId) => void
    resetBindings: () => void
    setEnabled: (enabled: boolean) => void
}

export type ShortcutMeta = {
    hasBindingOverrides: boolean
    availableActions: ShortcutActionId[]
}

export type ShortcutContextValue = {
    state: ShortcutState
    actions: ShortcutActions
    meta: ShortcutMeta
}
