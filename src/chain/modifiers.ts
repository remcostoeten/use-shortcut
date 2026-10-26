import type { Modifier } from "../shared/types/semantic"

type Conflicts = {
    ctrl: "ctrl" | "mod"
    meta: "meta" | "mod"
    mod: "mod" | "ctrl" | "meta"
    shift: "shift" | "lshift" | "rshift"
    lshift: "shift" | "lshift" | "rshift"
    rshift: "shift" | "lshift" | "rshift"
    alt: "alt"
}

type Part<Name extends Modifier, Used extends Modifier> = Name extends Used ? `${Name}+` : ""

/** Modifiers that can still be added once `Used` is in the step. */
export type AvailableModifier<Used extends Modifier> = Exclude<Modifier, Conflicts[Used]>

/** The written modifiers of one step in the order `formatCombo` uses, each followed by `+`. */
export type ModifierPrefix<Used extends Modifier> =
    `${Part<"mod", Used>}${Part<"ctrl", Used>}${Part<"meta", Used>}${Part<"alt", Used>}${Part<"shift", Used>}${Part<"lshift", Used>}${Part<"rshift", Used>}`
