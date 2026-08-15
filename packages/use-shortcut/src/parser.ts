import { ModifierAliases, SpecialKeyMap, detectPlatform, Platform } from "./constants"
import type { PlatformType } from "./constants"
import type { ModifierState, ParsedShortcut } from "./types"

function _normalizeKeyToken(key: string): string {
    return key === " " ? "space" : key.toLowerCase()
}

// Pressing Shift changes `event.key` for digits and symbols ("shift+2" arrives
// as "@"), so a shift-requiring binding must also accept the shifted character.
// US layout; other layouts fall back to the exact-key comparison.
export const _SHIFTED_KEY_MAP: Record<string, string> = {
    "1": "!",
    "2": "@",
    "3": "#",
    "4": "$",
    "5": "%",
    "6": "^",
    "7": "&",
    "8": "*",
    "9": "(",
    "0": ")",
    "-": "_",
    "=": "+",
    "[": "{",
    "]": "}",
    "\\": "|",
    ";": ":",
    "'": '"',
    ",": "<",
    ".": ">",
    "/": "?",
    "`": "~",
}

/**
 * Splits a combo into its sequence steps. `"g then d"` is two steps, and so is
 * the bare-space form `"g d"`; anything else is a single step. Lives beside the
 * parser so the dispatcher and the formatter can never disagree about where one
 * step ends and the next begins.
 */
export function _splitSequenceSteps(combo: string): string[] {
    const trimmed = combo.trim()
    if (!trimmed) return []

    if (/\sthen\s/i.test(trimmed)) {
        return trimmed.split(/\s+then\s+/i).map((step) => step.trim()).filter(Boolean)
    }

    if (trimmed.includes(" ") && !trimmed.includes("+")) {
        return trimmed.split(/\s+/)
    }

    return [trimmed]
}

function _tokenizeShortcut(shortcut: string): string[] {
    const normalized = shortcut.toLowerCase().trim()

    if (!normalized) return []

    if (!normalized.includes("+")) {
        const whitespaceTokens = normalized.split(/\s+/).filter(Boolean)

        if (whitespaceTokens.length === 1 && whitespaceTokens[0].includes("-")) {
            const hyphenTokens = whitespaceTokens[0].split("-").filter(Boolean)
            const hasModifierPrefix = hyphenTokens
                .slice(0, -1)
                .every((token) => Boolean(ModifierAliases[token]))

            if (hyphenTokens.length > 1 && hasModifierPrefix) {
                return hyphenTokens
            }
        }

        return whitespaceTokens
    }

    const tokens = normalized
        .split("+")
        .map((token) => token.trim())

    if (normalized.endsWith("+")) {
        while (tokens[tokens.length - 1] === "") {
            tokens.pop()
        }
        tokens.push("plus")
    }

    return tokens.filter(Boolean)
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
export function parseShortcut(shortcut: string, platform: PlatformType = detectPlatform()): ParsedShortcut {
    const parts = _tokenizeShortcut(shortcut)

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
    const finalKey = normalizedKey.length === 1 ? normalizedKey.toLowerCase() : normalizedKey

    return {
        modifiers,
        key: finalKey,
        original: shortcut,
        matchKey: _normalizeKeyToken(finalKey),
    }
}

/**
 * Parse multiple shortcut strings
 *
 * @param shortcuts - Single shortcut or array of shortcuts
 * @returns Array of parsed shortcuts
 */
export function parseShortcuts(shortcuts: string | string[], platform?: PlatformType): ParsedShortcut[] {
    const shortcutArray = Array.isArray(shortcuts) ? shortcuts : [shortcuts]
    return shortcutArray.map((shortcut) => parseShortcut(shortcut, platform))
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

    const expectedKey = parsed.matchKey ?? _normalizeKeyToken(parsed.key)
    const keyMatches =
        eventKey === expectedKey ||
        (parsed.modifiers.shift && _SHIFTED_KEY_MAP[expectedKey] === eventKey)

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
