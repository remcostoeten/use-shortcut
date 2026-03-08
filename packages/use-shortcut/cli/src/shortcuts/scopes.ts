/** App-defined scope catalog used by the scaffolded provider. */
export const shortcutScopes = ["global", "navigation", "editor", "modal"] as const

export type ShortcutScope = (typeof shortcutScopes)[number]

/** Default active scopes at provider boot. */
export const defaultActiveScopes: ShortcutScope[] = ["global", "navigation"]

/**
 * Normalizes a scope input into an array form.
 *
 * @param scopes - One or many scope names
 * @returns Array of scope names
 */
export function normalizeScopes(scopes: ShortcutScope | ShortcutScope[]): ShortcutScope[] {
    return Array.isArray(scopes) ? scopes : [scopes]
}
