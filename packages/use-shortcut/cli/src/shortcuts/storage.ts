import type { ShortcutActionId, ShortcutBindings } from "./registry"

/** Default localStorage key used by the scaffolded shortcut provider. */
export const DEFAULT_SHORTCUT_STORAGE_KEY = "app-shortcut-bindings"

function _isBindingValue(value: unknown): value is string | string[] {
    if (typeof value === "string") return true
    return Array.isArray(value) && value.every((entry) => typeof entry === "string")
}

/**
 * Loads persisted shortcut binding overrides from localStorage.
 *
 * @param storageKey - Storage key namespace
 * @returns Partial binding overrides keyed by action id
 */
export function loadShortcutBindings(storageKey: string): Partial<ShortcutBindings> {
    if (typeof window === "undefined") return {}

    try {
        const raw = window.localStorage.getItem(storageKey)
        if (!raw) return {}

        const parsed = JSON.parse(raw) as unknown
        if (!parsed || typeof parsed !== "object") return {}

        const result: Partial<ShortcutBindings> = {}

        for (const [actionId, value] of Object.entries(parsed as Record<string, unknown>)) {
            if (!_isBindingValue(value)) continue
            result[actionId as ShortcutActionId] = value
        }

        return result
    } catch {
        return {}
    }
}

/**
 * Persists all shortcut bindings to localStorage.
 *
 * @param storageKey - Storage key namespace
 * @param bindings - Full current binding set
 */
export function saveShortcutBindings(storageKey: string, bindings: ShortcutBindings): void {
    if (typeof window === "undefined") return

    try {
        window.localStorage.setItem(storageKey, JSON.stringify(bindings))
    } catch {
        // Ignore quota/security errors.
    }
}

/**
 * Removes persisted shortcut bindings from localStorage.
 *
 * @param storageKey - Storage key namespace
 */
export function clearShortcutBindings(storageKey: string): void {
    if (typeof window === "undefined") return

    try {
        window.localStorage.removeItem(storageKey)
    } catch {
        // Ignore quota/security errors.
    }
}
