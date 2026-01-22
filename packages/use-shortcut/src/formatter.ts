import {
    ModifierDisplayOrder,
    ModifierDisplaySymbols,
    Platform,
    detectPlatform,
    type ModifierKeyType,
    type PlatformType,
} from "./constants"
import { parseShortcut } from "./parser"

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
    const parsed = parseShortcut(shortcut)
    const symbols = ModifierDisplaySymbols[targetPlatform]
    const order = ModifierDisplayOrder[targetPlatform]

    const parts: string[] = []

    for (const modifier of order) {
        if (parsed.modifiers[modifier]) {
            parts.push(symbols[modifier])
        }
    }

    const displayKey = formatKey(parsed.key, targetPlatform)
    parts.push(displayKey)

    const separator = targetPlatform === Platform.MAC ? "" : "+"

    return parts.join(separator)
}

function formatKey(key: string, platform: PlatformType): string {
    const displayNames: Record<string, string> = {
        ArrowUp: "↑",
        ArrowDown: "↓",
        ArrowLeft: "←",
        ArrowRight: "→",
        Enter: platform === Platform.MAC ? "↩" : "Enter",
        Tab: platform === Platform.MAC ? "⇥" : "Tab",
        Escape: platform === Platform.MAC ? "⎋" : "Esc",
        Backspace: platform === Platform.MAC ? "⌫" : "Backspace",
        Delete: platform === Platform.MAC ? "⌦" : "Del",
        " ": platform === Platform.MAC ? "␣" : "Space",
        Home: "Home",
        End: "End",
        PageUp: "PgUp",
        PageDown: "PgDn",
    }

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

