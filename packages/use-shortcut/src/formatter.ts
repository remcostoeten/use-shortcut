import {
    ModifierDisplayOrder,
    ModifierDisplaySymbols,
    OS,
    detectPlatform,
    type ModifierKeyType,
    type PlatformType,
} from "./constants"
import { parseShortcut } from "./parser"

const _BASE_DISPLAY_NAMES: Record<string, string> = {
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    Home: "Home",
    End: "End",
    PageUp: "PgUp",
    PageDown: "PgDn",
}

const _MAC_DISPLAY_NAMES: Record<string, string> = {
    ..._BASE_DISPLAY_NAMES,
    Enter: "↩",
    Tab: "⇥",
    Escape: "⎋",
    Backspace: "⌫",
    Delete: "⌦",
    " ": "␣",
}

const _NON_MAC_DISPLAY_NAMES: Record<string, string> = {
    ..._BASE_DISPLAY_NAMES,
    Enter: "Enter",
    Tab: "Tab",
    Escape: "Esc",
    Backspace: "Backspace",
    Delete: "Del",
    " ": "Space",
}

/**
 * Format a shortcut string for display with platform-aware symbols
 *
 * @param shortcut - Shortcut string (e.g., "cmd+s")
 * @param platform - Optional platform override (default: auto-detect)
 * @returns Formatted display string (e.g., "⌘S" on Mac, "Ctrl+S" on Windows)
 *
 * @example
 * ```ts
 * formatShortcut("cmd+s") // "⌘S" on Mac, "Ctrl+S" on Windows
 * formatShortcut("ctrl+shift+p", "mac") // "⌃⇧P"
 * ```
 */
export function formatShortcut(shortcut: string, platform?: PlatformType): string {
    const targetPlatform = platform ?? detectPlatform()
    const parsed = parseShortcut(shortcut, targetPlatform)
    const symbols = ModifierDisplaySymbols[targetPlatform]
    const order = ModifierDisplayOrder[targetPlatform]

    const parts: string[] = []

    for (const modifier of order) {
        if (parsed.modifiers[modifier]) {
            parts.push(symbols[modifier])
        }
    }

    const displayKey = _formatKey(parsed.key, targetPlatform)
    parts.push(displayKey)

    const separator = targetPlatform === OS.MAC ? "" : "+"

    return parts.join(separator)
}

function _formatKey(key: string, platform: PlatformType): string {
    const displayNames = platform === OS.MAC ? _MAC_DISPLAY_NAMES : _NON_MAC_DISPLAY_NAMES

    return displayNames[key] || key.toUpperCase()
}

/**
 * Get the modifier key symbols for a platform
 *
 * @param platform - Optional platform override (default: auto-detect)
 * @returns Object mapping modifier keys to display symbols
 *
 * @example
 * ```ts
 * getModifierSymbols("mac") // { meta: "⌘", ctrl: "⌃", alt: "⌥", shift: "⇧" }
 * ```
 */
export function getModifierSymbols(platform?: PlatformType): Record<ModifierKeyType, string> {
    const targetPlatform = platform ?? detectPlatform()
    return ModifierDisplaySymbols[targetPlatform]
}
