import { detectPlatform, type PlatformType } from "./constants"
import { _splitSequenceSteps, parseShortcut } from "./parser"
import { _detectConflict } from "./runtime/conflicts"
import { _canonicalizeParsed } from "./runtime/keys"
import type { ParsedShortcut, ShortcutConflict } from "./types"

function _parseSteps(combo: string, platform: PlatformType): ParsedShortcut[] {
    const steps = _splitSequenceSteps(combo)

    if (steps.length === 0) {
        throw new Error(`Invalid shortcut: "${combo}"`)
    }

    return steps.map(step => parseShortcut(step, platform))
}

/**
 * Reduce a combo to the canonical form the dispatcher matches on, so two
 * spellings of one binding compare and store as the same string. Modifiers are
 * ordered, aliases resolved, and `mod` is expanded for the target platform.
 *
 * Use it as the storage form for user rebinds; a recorded `"Ctrl + K"` and a
 * default of `"mod+k"` should not persist as two different settings values.
 *
 * @param combo - Shortcut string, chord or sequence
 * @param platform - Optional platform override (default: auto-detect)
 * @returns Canonical combo string, sequence steps rejoined with `" then "`
 * @throws If `combo` contains no parseable step
 *
 * @example
 * ```ts
 * canonicalizeShortcut("Ctrl + K", "windows") // "ctrl+k"
 * canonicalizeShortcut("mod+k", "windows") // "ctrl+k"
 * canonicalizeShortcut("g then D") // "g then d"
 * ```
 */
export function canonicalizeShortcut(combo: string, platform?: PlatformType): string {
    const targetPlatform = platform ?? detectPlatform()
    return _parseSteps(combo, targetPlatform).map(_canonicalizeParsed).join(" then ")
}

/**
 * Whether two combos resolve to the same binding. Compares canonical forms
 * rather than raw text, so `"mod+k"`, `"Ctrl + K"`, and a recorded `"ctrl+k"`
 * are equal on platforms where `mod` means ctrl.
 *
 * @param a - First shortcut string
 * @param b - Second shortcut string
 * @param platform - Optional platform override (default: auto-detect)
 * @returns `true` when both combos would match the same keystrokes
 *
 * @example
 * ```ts
 * sameShortcut("mod+k", "ctrl+k", "windows") // true
 * sameShortcut("mod+k", "mod+j") // false
 * ```
 */
export function sameShortcut(a: string, b: string, platform?: PlatformType): boolean {
    const targetPlatform = platform ?? detectPlatform()

    try {
        return (
            canonicalizeShortcut(a, targetPlatform) ===
            canonicalizeShortcut(b, targetPlatform)
        )
    } catch {
        return a.trim() === b.trim()
    }
}

/**
 * How two combos collide, or `null` when they can coexist. `"exact"` means they
 * match the same keystrokes; `"sequence-prefix"` means one is a leading prefix
 * of the other, so the shorter would fire before the longer can complete.
 *
 * This is the same test the registry applies when it warns about conflicts,
 * exposed so a rebinding UI can reject a combo before registering it.
 *
 * @param a - First shortcut string
 * @param b - Second shortcut string
 * @param platform - Optional platform override (default: auto-detect)
 * @returns The conflict reason, or `null` if the two can be bound together
 * @throws If either combo contains no parseable step
 *
 * @example
 * ```ts
 * shortcutConflict("mod+k", "ctrl+k", "windows") // "exact"
 * shortcutConflict("g", "g then d") // "sequence-prefix"
 * shortcutConflict("mod+k", "mod+j") // null
 * ```
 */
export function shortcutConflict(
    a: string,
    b: string,
    platform?: PlatformType
): ShortcutConflict["reason"] | null {
    const targetPlatform = platform ?? detectPlatform()
    return _detectConflict(_parseSteps(a, targetPlatform), _parseSteps(b, targetPlatform))
}

/**
 * The first already-bound combo that `combo` would collide with, or `null` when
 * it is free. Wraps {@link shortcutConflict} for the common rebinding-UI case
 * of validating one candidate against every existing binding.
 *
 * Unparseable entries in `existing` are skipped rather than thrown on, so one
 * bad stored override cannot break the whole check.
 *
 * @param combo - The candidate shortcut string
 * @param existing - Combos already bound elsewhere
 * @param platform - Optional platform override (default: auto-detect)
 * @returns The colliding combo and reason, or `null` when there is no conflict
 * @throws If `combo` contains no parseable step
 *
 * @example
 * ```ts
 * findShortcutConflict("mod+k", ["mod+s", "ctrl+k"], "windows")
 * // { combo: "ctrl+k", reason: "exact" }
 * ```
 */
export function findShortcutConflict(
    combo: string,
    existing: readonly string[],
    platform?: PlatformType
): { combo: string; reason: ShortcutConflict["reason"] } | null {
    const targetPlatform = platform ?? detectPlatform()
    const candidate = _parseSteps(combo, targetPlatform)

    for (const other of existing) {
        let reason: ShortcutConflict["reason"] | null

        try {
            reason = _detectConflict(candidate, _parseSteps(other, targetPlatform))
        } catch {
            continue
        }

        if (reason) {
            return { combo: other, reason }
        }
    }

    return null
}
