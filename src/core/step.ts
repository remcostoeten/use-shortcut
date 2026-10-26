import { canonicalKeyName, isKeyName, resolveKey, suggestKeyName } from "./keys"
import type {
    KeyName,
    KeySide,
    KeyValue,
    Milliseconds,
    Modifier,
    Nullable,
    Platform,
    StepSignature,
} from "../shared/types/semantic"

/** Which Shift a step needs: none, either side, or one specific side. */
type ShiftRequirement = "none" | "any" | KeySide

type StepInputBase = {
    key: KeyName
    modifiers: readonly Modifier[]
    minDelay?: Milliseconds
}

/** One step as written by the user. `minDelay` comes from a `wait` before it. */
export type StepInput =
    | (StepInputBase & { kind: "press" })
    | (StepInputBase & { kind: "hold"; threshold?: Milliseconds })

type StepBase = {
    key: KeyName
    ctrl: boolean
    alt: boolean
    meta: boolean
    shift: ShiftRequirement
    minDelay: Milliseconds
    signature: StepSignature
}

type PressStep = StepBase & { kind: "press" }
export type HoldStep = StepBase & { kind: "hold"; threshold: Milliseconds }

/** A step with `mod` resolved for the platform, ready to compare against key input. */
export type Step = PressStep | HoldStep

/** The modifier state of one key event as the matcher sees it. */
export type HeldModifiers = {
    ctrl: boolean
    alt: boolean
    meta: boolean
    shift: boolean
    shiftSide: Nullable<KeySide>
}

function unknownKey(key: string): string {
    const suggestion = suggestKeyName(key)
    const hint = suggestion
        ? `, did you mean "${suggestion}"?`
        : ". See KEY_NAMES for the accepted names."
    return `use-shortcut: unknown key "${key}"${hint}`
}

function shiftRequirement(modifiers: ReadonlySet<Modifier>): ShiftRequirement {
    if (modifiers.has("shift")) return "any"
    if (modifiers.has("lshift")) return "left"
    if (modifiers.has("rshift")) return "right"
    return "none"
}

/**
 * @name resolveStep
 * @description Turns a written step into a platform-specific one. `mod` becomes Cmd on a Mac and Ctrl
 * elsewhere. Throws on an unknown key name, which only untyped callers can pass.
 *
 * @example
 * resolveStep({ kind: "press", key: "k", modifiers: ["mod"] }, "mac", 500).meta // true
 */
export function resolveStep(
    input: StepInput,
    platform: Platform,
    holdThreshold: Milliseconds,
): Step {
    if (!isKeyName(input.key)) throw new Error(unknownKey(input.key))
    const key = canonicalKeyName(input.key)
    const modifiers = new Set(input.modifiers)
    const mod = modifiers.has("mod")
    const ctrl = modifiers.has("ctrl") || (mod && platform === "other")
    const meta = modifiers.has("meta") || (mod && platform === "mac")
    const alt = modifiers.has("alt")
    const shift = shiftRequirement(modifiers)
    const minDelay = input.minDelay ?? 0
    const combo = [
        ctrl && "ctrl",
        alt && "alt",
        meta && "meta",
        shift !== "none" && `shift:${shift}`,
        key,
    ]
        .filter(Boolean)
        .join("+")
    const base = { key, ctrl, alt, meta, shift, minDelay }
    if (input.kind === "press")
        return { ...base, kind: "press", signature: `wait:${minDelay}>${combo}` }
    const threshold = input.threshold ?? holdThreshold
    return {
        ...base,
        kind: "hold",
        threshold,
        signature: `wait:${minDelay}>hold:${threshold}:${combo}`,
    }
}

function shiftMatches(required: ShiftRequirement, held: HeldModifiers): boolean {
    if (required === "none") return !held.shift
    if (!held.shift) return false
    return required === "any" || required === held.shiftSide
}

/**
 * @name stepMatches
 * @description Reports whether a key event satisfies a step. Modifiers match exactly, except Shift when
 * it only produces the character, so `+` matches `plus` with Shift held.
 *
 * @example
 * stepMatches(step, "k", { ctrl: true, alt: false, meta: false, shift: false, shiftSide: null })
 */
export function stepMatches(step: Step, key: KeyValue, held: HeldModifiers): boolean {
    if (step.ctrl !== held.ctrl || step.alt !== held.alt || step.meta !== held.meta) return false
    return resolveKey(key).some((candidate) => {
        if (candidate.name !== step.key) return false
        if (candidate.shift === "ignored") return step.shift === "none"
        if (candidate.shift === "implied")
            return step.shift !== "none" && shiftMatches(step.shift, held)
        return shiftMatches(step.shift, held)
    })
}
