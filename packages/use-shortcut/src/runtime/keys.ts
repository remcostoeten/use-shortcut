import { detectPlatform, ModifierDisplayOrder, ModifierKey } from "../constants"
import { formatShortcut } from "../formatter"
import type { ModifierFlags, ParsedShortcut } from "../types"

export function _getActiveModifierTokens(
    modifiers: Partial<ModifierFlags>
): string[] {
    const platform = detectPlatform()
    const order = ModifierDisplayOrder[platform]

    return order
        .filter(key => {
            if (key === ModifierKey.CTRL) return modifiers.ctrl
            if (key === ModifierKey.ALT) return modifiers.alt
            if (key === ModifierKey.SHIFT) return modifiers.shift
            if (key === ModifierKey.META) return modifiers.cmd
            return false
        })
        .map(key => {
            if (key === ModifierKey.CTRL) return "ctrl"
            if (key === ModifierKey.ALT) return "alt"
            if (key === ModifierKey.SHIFT) return "shift"
            if (key === ModifierKey.META) return "cmd"
            return ""
        })
}

export function _buildComboString(
    modifiers: Partial<ModifierFlags>,
    key: string
): string {
    const tokens = _getActiveModifierTokens(modifiers)
    return [...tokens, key].join("+")
}

export function _formatSequenceDisplay(steps: string[]): string {
    return steps.map(step => formatShortcut(step)).join(" then ")
}

export function _canonicalizeParsed(parsed: ParsedShortcut): string {
    const modifiers: string[] = []
    if (parsed.modifiers.ctrl) modifiers.push("ctrl")
    if (parsed.modifiers.alt) modifiers.push("alt")
    if (parsed.modifiers.shift) modifiers.push("shift")
    if (parsed.modifiers.meta) modifiers.push("cmd")
    const key =
        parsed.key === " " || parsed.key === "Spacebar"
            ? "space"
            : parsed.key.toLowerCase()
    return [...modifiers, key].join("+")
}

export function _eventToCombo(event: KeyboardEvent): string {
    const modifiers: string[] = []
    if (event.ctrlKey) modifiers.push("ctrl")
    if (event.altKey) modifiers.push("alt")
    if (event.shiftKey) modifiers.push("shift")
    if (event.metaKey) modifiers.push("cmd")

    const key = event.key === " " ? "space" : event.key.toLowerCase()
    return [...modifiers, key].join("+")
}

export function _eventToMatchStep(event: KeyboardEvent): string {
    const modifiers: string[] = []
    if (event.ctrlKey) modifiers.push("ctrl")
    if (event.altKey) modifiers.push("alt")
    if (event.shiftKey) modifiers.push("shift")
    if (event.metaKey) modifiers.push("cmd")
    const key =
        event.key === " " || event.key === "Spacebar"
            ? "space"
            : event.key.toLowerCase()
    return [...modifiers, key].join("+")
}
