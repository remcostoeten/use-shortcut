import {
    ModifierDisplayOrder,
    ModifierDisplaySymbols,
    OS,
    detectPlatform,
    type ModifierKeyType,
    type PlatformType,
} from "./constants"
import { _splitSequenceSteps, parseShortcut } from "./parser"

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

function _formatStep(step: string, platform: PlatformType): string {
    const parsed = parseShortcut(step, platform)
    const symbols = ModifierDisplaySymbols[platform]
    const order = ModifierDisplayOrder[platform]

    const parts: string[] = []

    for (const modifier of order) {
        if (parsed.modifiers[modifier]) {
            parts.push(symbols[modifier])
        }
    }

    parts.push(_formatKey(parsed.key, platform))

    const separator = platform === OS.MAC ? "" : "+"

    return parts.join(separator)
}

/**
 * Format each step of a shortcut separately, for UIs that render one `<kbd>`
 * per step. A plain chord yields a single entry; a sequence yields one entry
 * per step, so a cheat sheet never has to re-split a joined string.
 *
 * @param shortcut - Shortcut string, chord or sequence (e.g., `"g then d"`)
 * @param platform - Optional platform override (default: auto-detect)
 * @returns One formatted display string per sequence step
 *
 * @example
 * ```ts
 * formatShortcutSteps("g then d", "windows") // ["G", "D"]
 * formatShortcutSteps("mod+s", "mac") // ["⌘S"]
 * ```
 */
export function formatShortcutSteps(shortcut: string, platform?: PlatformType): string[] {
    const targetPlatform = platform ?? detectPlatform()
    const steps = _splitSequenceSteps(shortcut)

    if (steps.length === 0) {
        throw new Error(`Invalid shortcut: "${shortcut}"`)
    }

    return steps.map(step => _formatStep(step, targetPlatform))
}

/**
 * Format a shortcut string for display with platform-aware symbols
 *
 * Sequences are formatted step by step and rejoined with `" then "`, matching
 * how they are written in a combo string.
 *
 * @param shortcut - Shortcut string (e.g., `"cmd+s"`, `"g then d"`)
 * @param platform - Optional platform override (default: auto-detect)
 * @returns Formatted display string (e.g., "⌘S" on Mac, "Ctrl+S" on Windows)
 *
 * @example
 * ```ts
 * formatShortcut("cmd+s") // "⌘S" on Mac, "Ctrl+S" on Windows
 * formatShortcut("ctrl+shift+p", "mac") // "⌃⇧P"
 * formatShortcut("g then d", "windows") // "G then D"
 * ```
 */
export function formatShortcut(shortcut: string, platform?: PlatformType): string {
    return formatShortcutSteps(shortcut, platform).join(" then ")
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
