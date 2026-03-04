import { ModifierAliases, SpecialKeyMap, detectPlatform, Platform } from "./constants"
import type { ModifierState, ParsedShortcut } from "./types"

function _normalizeKeyToken(key: string): string {
    return key === " " ? "space" : key.toLowerCase()
}

/**
 * Parse a shortcut string into its components
 *
 * @param shortcut - Shortcut string (e.g., "cmd+s", "ctrl+shift+p")
 * @returns Parsed shortcut with modifiers, key, and original string
 *
 * @example
 * ```ts
 * const parsed = parseShortcut("cmd+s")
 * // { modifiers: { meta: true, ... }, key: "s", original: "cmd+s" }
 * ```
 */
export function parseShortcut(shortcut: string): ParsedShortcut {
    const platform = detectPlatform()
    const normalized = shortcut.toLowerCase().trim()
    const parts = normalized.split(/[\s+-]+/).filter(Boolean)

    if (parts.length === 0) {
        throw new Error(`Invalid shortcut: "${shortcut}"`)
    }

    const modifiers: ModifierState = {
        meta: false,
        ctrl: false,
        alt: false,
        shift: false,
    }

    let key = parts.pop()!

    for (const part of parts) {
        const modifierKey = ModifierAliases[part]

        if (modifierKey) {
            if (part === "mod") {
                if (platform === Platform.MAC) {
                    modifiers.meta = true
                } else {
                    modifiers.ctrl = true
                }
            } else {
                modifiers[modifierKey] = true
            }
        } else {
            key = part + key
        }
    }

    const normalizedKey = SpecialKeyMap[key] || key

    return {
        modifiers,
        key: normalizedKey.length === 1 ? normalizedKey.toLowerCase() : normalizedKey,
        original: shortcut,
    }
}

/**
 * Parse multiple shortcut strings
 *
 * @param shortcuts - Single shortcut or array of shortcuts
 * @returns Array of parsed shortcuts
 */
export function parseShortcuts(shortcuts: string | string[]): ParsedShortcut[] {
    const shortcutArray = Array.isArray(shortcuts) ? shortcuts : [shortcuts]
    return shortcutArray.map(parseShortcut)
}

/**
 * Extract modifier state from a keyboard event
 *
 * @param event - The keyboard event
 * @returns Object with meta, ctrl, alt, shift boolean flags
 */
export function getModifiersFromEvent(event: KeyboardEvent): ModifierState {
    return {
        meta: event.metaKey,
        ctrl: event.ctrlKey,
        alt: event.altKey,
        shift: event.shiftKey,
    }
}

/**
 * Check if a keyboard event matches a parsed shortcut
 *
 * @param event - The keyboard event to check
 * @param parsed - The parsed shortcut to match against
 * @returns `true` if the event matches the shortcut
 */
export function matchesShortcut(event: KeyboardEvent, parsed: ParsedShortcut): boolean {
    const eventModifiers = getModifiersFromEvent(event)
    const eventKey = _normalizeKeyToken(event.key)

    const modifiersMatch =
        eventModifiers.meta === parsed.modifiers.meta &&
        eventModifiers.ctrl === parsed.modifiers.ctrl &&
        eventModifiers.alt === parsed.modifiers.alt &&
        eventModifiers.shift === parsed.modifiers.shift

    const keyMatches = eventKey === _normalizeKeyToken(parsed.key)

    return modifiersMatch && keyMatches
}

/**
 * Check if a keyboard event matches any of the parsed shortcuts
 *
 * @param event - The keyboard event to check
 * @param parsedShortcuts - Array of parsed shortcuts to match against
 * @returns `true` if the event matches any shortcut
 */
export function matchesAnyShortcut(event: KeyboardEvent, parsedShortcuts: ParsedShortcut[]): boolean {
    return parsedShortcuts.some((parsed) => matchesShortcut(event, parsed))
}
