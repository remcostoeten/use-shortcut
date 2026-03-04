import type { ParsedShortcut, ShortcutConflict } from "../types"
import type { ShortcutRegistry } from "./types"

import { _canonicalizeParsed } from "./keys"

function _isPrefix(a: ParsedShortcut[], b: ParsedShortcut[]): boolean {
    if (a.length > b.length) return false
    for (let i = 0; i < a.length; i += 1) {
        if (_canonicalizeParsed(a[i]) !== _canonicalizeParsed(b[i])) {
            return false
        }
    }
    return true
}

export function _detectConflict(newSteps: ParsedShortcut[], existingSteps: ParsedShortcut[]): ShortcutConflict["reason"] | null {
    const newCombo = newSteps.map(_canonicalizeParsed).join(" ")
    const existingCombo = existingSteps.map(_canonicalizeParsed).join(" ")

    if (newCombo === existingCombo) return "exact"
    if (_isPrefix(newSteps, existingSteps) || _isPrefix(existingSteps, newSteps)) {
        return "sequence-prefix"
    }

    return null
}

export function _emitConflict(registry: ShortcutRegistry, conflict: ShortcutConflict) {
    const conflictWarnings = registry.options.conflictWarnings ?? true

    if (registry.options.onConflict) {
        registry.options.onConflict(conflict)
        return
    }

    if (!conflictWarnings) return

    console.warn(
        `[useShortcut] Conflict detected (${conflict.reason}) between "${conflict.combo}" and "${conflict.existingCombo}"`,
    )
}

