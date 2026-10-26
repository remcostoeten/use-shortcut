import { KEY_ALIASES, KEY_NAMES } from "../shared/vocabulary"
import type { KeyCode, KeyName, KeyValue, Nullable } from "../shared/types/semantic"

/** How Shift relates to a produced character: implied by it, irrelevant to it, or matched exactly. */
type ShiftUse = "implied" | "ignored" | "exact"

type ResolvedKey = {
    name: KeyName
    shift: ShiftUse
}

const KEY_NAME_SET: ReadonlySet<string> = new Set(KEY_NAMES)

function isAlias(name: KeyName): name is keyof typeof KEY_ALIASES {
    return name in KEY_ALIASES
}
const MODIFIER_KEYS: ReadonlySet<string> = new Set(["shift", "control", "alt", "meta", "os"])

const PLAIN_ALIASES: ReadonlyMap<string, KeyName> = new Map([
    [" ", "space"],
    ["arrowup", "up"],
    ["arrowdown", "down"],
    ["arrowleft", "left"],
    ["arrowright", "right"],
    ["-", "minus"],
    ["=", "equals"],
    [",", "comma"],
    [".", "period"],
    ["/", "slash"],
    [";", "semicolon"],
    ["'", "quote"],
    ["`", "backtick"],
])

const SHIFTED_CHARACTERS: ReadonlyMap<string, KeyName> = new Map([
    ["?", "slash"],
    ["<", "comma"],
    [">", "period"],
    [":", "semicolon"],
    ['"', "quote"],
    ["~", "backtick"],
    ["_", "minus"],
    ["+", "equals"],
    ["!", "1"],
    ["@", "2"],
    ["#", "3"],
    ["$", "4"],
    ["%", "5"],
    ["^", "6"],
    ["&", "7"],
    ["*", "8"],
    ["(", "9"],
    [")", "0"],
])

/**
 * @name isKeyName
 * @description Narrows a string to one of the key names the library accepts.
 *
 * @example
 * if (!isKeyName(input)) throw new Error(`Unknown key "${input}"`)
 */
export function isKeyName(value: string): value is KeyName {
    return KEY_NAME_SET.has(value)
}

/**
 * @name isModifierKey
 * @description Reports whether a `KeyboardEvent.key` value is a modifier key on its own, which never
 * advances or breaks a sequence.
 *
 * @example
 * isModifierKey("Shift") // true
 */
export function isModifierKey(key: KeyValue): boolean {
    return MODIFIER_KEYS.has(key.toLowerCase())
}

function distance(a: string, b: string): number {
    let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
    for (let i = 1; i <= a.length; i += 1) {
        const current = [i]
        for (let j = 1; j <= b.length; j += 1) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1
            current[j] = Math.min(
                (previous[j] ?? 0) + 1,
                (current[j - 1] ?? 0) + 1,
                (previous[j - 1] ?? 0) + cost,
            )
        }
        previous = current
    }
    return previous[b.length] ?? 0
}

const PHYSICAL_NAMES: ReadonlyMap<string, KeyName> = new Map([
    ["space", "space"],
    ["enter", "enter"],
    ["escape", "escape"],
    ["tab", "tab"],
    ["backspace", "backspace"],
    ["delete", "delete"],
    ["arrowup", "up"],
    ["arrowdown", "down"],
    ["arrowleft", "left"],
    ["arrowright", "right"],
    ["home", "home"],
    ["end", "end"],
    ["pageup", "pageup"],
    ["pagedown", "pagedown"],
    ["minus", "minus"],
    ["equal", "equals"],
    ["comma", "comma"],
    ["period", "period"],
    ["slash", "slash"],
    ["semicolon", "semicolon"],
    ["quote", "quote"],
    ["backquote", "backtick"],
])

/**
 * @name physicalKeyName
 * @description Maps a `KeyboardEvent.code` such as `"KeyK"` or `"Digit1"` to a key name, assuming a
 * US physical layout. Used when Alt is held, because Alt changes the produced character on a Mac
 * while the physical key is what the binding means.
 *
 * @example
 * physicalKeyName("KeyK") // "k"
 */
export function physicalKeyName(code: KeyCode): Nullable<KeyName> {
    const lower = code.toLowerCase()
    const letter = /^key([a-z])$/.exec(lower)?.[1]
    const digit = /^digit([0-9])$/.exec(lower)?.[1]
    const candidate = letter ?? digit ?? PHYSICAL_NAMES.get(lower) ?? lower
    return isKeyName(candidate) ? candidate : null
}

/**
 * @name suggestKeyName
 * @description Finds the accepted key name closest to a misspelled one, for error messages. Answers
 * null when nothing is within two edits.
 *
 * @example
 * suggestKeyName("escpae") // "escape"
 */
export function suggestKeyName(value: string): Nullable<KeyName> {
    const lower = value.toLowerCase()
    const ranked = KEY_NAMES.map((name) => ({ name, score: distance(lower, name) })).sort(
        (a, b) => a.score - b.score,
    )
    const best = ranked[0]
    return best && best.score <= 2 ? best.name : null
}

/**
 * @name canonicalKeyName
 * @description Maps an alternative spelling such as `dot` or `singlequote` to the name the matcher
 * stores, so a binding written either way matches the same key.
 *
 * @example
 * canonicalKeyName("dot") // "period"
 */
export function canonicalKeyName(name: KeyName): KeyName {
    return isAlias(name) ? KEY_ALIASES[name] : name
}

/**
 * @name resolveKey
 * @description Maps a `KeyboardEvent.key` value to every key name it can stand for. Letters ignore case so
 * Caps Lock does not matter, shifted characters such as `?` resolve to their base key with Shift implied,
 * and `+` resolves to both `plus` and Shift with `equals`. Assumes a US layout for shifted characters.
 *
 * @example
 * resolveKey("?") // [{ name: "slash", shift: "implied" }]
 */
export function resolveKey(key: KeyValue): readonly ResolvedKey[] {
    const lower = key.toLowerCase()
    if (lower === "+") {
        return [
            { name: "plus", shift: "ignored" },
            { name: "equals", shift: "implied" },
        ]
    }
    const shifted = SHIFTED_CHARACTERS.get(lower)
    if (shifted) return [{ name: shifted, shift: "implied" }]
    const alias = PLAIN_ALIASES.get(lower)
    if (alias) return [{ name: alias, shift: "exact" }]
    if (isKeyName(lower)) return [{ name: lower, shift: "exact" }]
    return []
}
