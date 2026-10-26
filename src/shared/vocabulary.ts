export const MODIFIERS = ["ctrl", "shift", "lshift", "rshift", "alt", "meta", "mod"] as const

const LETTER_KEYS = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
] as const

const DIGIT_KEYS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const

const FUNCTION_KEYS = [
    "f1",
    "f2",
    "f3",
    "f4",
    "f5",
    "f6",
    "f7",
    "f8",
    "f9",
    "f10",
    "f11",
    "f12",
] as const

const NAMED_KEYS = [
    "enter",
    "escape",
    "space",
    "tab",
    "backspace",
    "delete",
    "up",
    "down",
    "left",
    "right",
    "home",
    "end",
    "pageup",
    "pagedown",
    "plus",
    "minus",
    "equals",
    "comma",
    "period",
    "slash",
    "semicolon",
    "quote",
    "backtick",
] as const

/** Other spellings of a named key. Each resolves to the canonical name before matching. */
export const KEY_ALIASES = {
    dot: "period",
    singlequote: "quote",
} as const

const ALIAS_KEYS = ["dot", "singlequote"] as const

export const KEY_NAMES = [
    ...LETTER_KEYS,
    ...DIGIT_KEYS,
    ...FUNCTION_KEYS,
    ...NAMED_KEYS,
    ...ALIAS_KEYS,
] as const
