import type { StepInput } from "../core/step"
import type { Combo, KeyName, Modifier, Platform } from "../shared/types/semantic"

const MAC_MODIFIERS: Readonly<Record<Modifier, string>> = {
    ctrl: "⌃",
    alt: "⌥",
    shift: "⇧",
    lshift: "⇧",
    rshift: "⇧",
    meta: "⌘",
    mod: "⌘",
}

const OTHER_MODIFIERS: Readonly<Record<Modifier, string>> = {
    ctrl: "Ctrl",
    alt: "Alt",
    shift: "Shift",
    lshift: "Shift",
    rshift: "Shift",
    meta: "Win",
    mod: "Ctrl",
}

const KEY_LABELS: Readonly<Partial<Record<KeyName, string>>> = {
    enter: "↵",
    escape: "Esc",
    space: "Space",
    tab: "⇥",
    backspace: "⌫",
    delete: "⌦",
    up: "↑",
    down: "↓",
    left: "←",
    right: "→",
    pageup: "PgUp",
    pagedown: "PgDn",
    plus: "+",
    minus: "-",
    equals: "=",
    comma: ",",
    period: ".",
    dot: ".",
    slash: "/",
    semicolon: ";",
    quote: "'",
    singlequote: "'",
    backtick: "`",
}

const WRITTEN_ORDER: readonly Modifier[] = [
    "mod",
    "ctrl",
    "meta",
    "alt",
    "shift",
    "lshift",
    "rshift",
]

const MAC_ORDER: readonly Modifier[] = ["ctrl", "alt", "shift", "lshift", "rshift", "meta", "mod"]

function orderedModifiers(step: StepInput, order: readonly Modifier[]): readonly Modifier[] {
    return order.filter((modifier) => step.modifiers.includes(modifier))
}

function writtenStep(step: StepInput): string {
    const combo = [...orderedModifiers(step, WRITTEN_ORDER), step.key].join("+")
    const wait = step.minDelay ? `wait ${step.minDelay}ms then ` : ""
    return step.kind === "hold" ? `${wait}hold ${combo}` : `${wait}${combo}`
}

function keyLabel(key: KeyName): string {
    return (
        KEY_LABELS[key] ??
        (key.length === 1 ? key.toUpperCase() : key[0]?.toUpperCase() + key.slice(1))
    )
}

function displayedStep(step: StepInput, platform: Platform): string {
    const mac = platform === "mac"
    const symbols = mac ? MAC_MODIFIERS : OTHER_MODIFIERS
    const modifiers = orderedModifiers(step, mac ? MAC_ORDER : WRITTEN_ORDER)
    const parts = [...modifiers.map((modifier) => symbols[modifier]), keyLabel(step.key)]
    const combo = mac ? parts.join("") : parts.join("+")
    return step.kind === "hold" ? `hold ${combo}` : combo
}

/**
 * @name formatCombo
 * @description Writes a list of steps the way a user would type it in the chain, such as
 * `"mod+k then s"` or `"a then wait 300ms then hold c"`. Used as the binding's `combo` and for
 * duplicate detection.
 *
 * @example
 * formatCombo([{ kind: "press", key: "k", modifiers: ["mod"] }]) // "mod+k"
 */
export function formatCombo(steps: readonly StepInput[]): Combo {
    return steps.map(writtenStep).join(" then ")
}

/**
 * @name displayCombo
 * @description Renders steps as a label for the current platform: `⌘K` on a Mac, `Ctrl+K`
 * elsewhere. Sequence steps are separated by spaces and waits are left out.
 *
 * @example
 * displayCombo([{ kind: "press", key: "k", modifiers: ["mod"] }], "mac") // "⌘K"
 */
export function displayCombo(steps: readonly StepInput[], platform: Platform): string {
    return steps.map((step) => displayedStep(step, platform)).join(" ")
}
