/**
 * ============================================================================
 * KEYBOARD KEY MAPS - Enterprise Grade Key Definitions
 * ============================================================================
 *
 * Complete mapping of all keyboard keys with type-safe literals.
 * Organized by category for maintainability and discoverability.
 */

// ─────────────────────────────────────────────────────────────────────────────
// MODIFIER KEYS - The foundation of keyboard shortcuts
// ─────────────────────────────────────────────────────────────────────────────

export const MODIFIER_KEYS = {
  // Control key variants
  ctrl: "ctrl",
  control: "ctrl",
  ctl: "ctrl",

  // Shift key variants
  shift: "shift",
  shft: "shift",
  "⇧": "shift",

  // Alt/Option key variants
  alt: "alt",
  option: "alt",
  opt: "alt",
  "⌥": "alt",

  // Meta/Command/Windows key variants
  meta: "meta",
  cmd: "meta",
  command: "meta",
  "⌘": "meta",
  win: "meta",
  windows: "meta",
  super: "meta",

  // Cross-platform modifier (cmd on Mac, ctrl on Windows/Linux)
  mod: "mod",
  $mod: "mod",
} as const

export type ModifierAlias = keyof typeof MODIFIER_KEYS
export type NormalizedModifier = "ctrl" | "shift" | "alt" | "meta" | "mod"

// ─────────────────────────────────────────────────────────────────────────────
// ALPHA KEYS - A-Z
// ─────────────────────────────────────────────────────────────────────────────

export const ALPHA_KEYS = [
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

export type AlphaKey = (typeof ALPHA_KEYS)[number]

// ─────────────────────────────────────────────────────────────────────────────
// NUMERIC KEYS - 0-9
// ─────────────────────────────────────────────────────────────────────────────

export const NUMERIC_KEYS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const

export type NumericKey = (typeof NUMERIC_KEYS)[number]

// ─────────────────────────────────────────────────────────────────────────────
// FUNCTION KEYS - F1-F24
// ─────────────────────────────────────────────────────────────────────────────

export const FUNCTION_KEYS = [
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
  "f13",
  "f14",
  "f15",
  "f16",
  "f17",
  "f18",
  "f19",
  "f20",
  "f21",
  "f22",
  "f23",
  "f24",
] as const

export type FunctionKey = (typeof FUNCTION_KEYS)[number]

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION KEYS - Arrows, Page navigation, etc.
// ─────────────────────────────────────────────────────────────────────────────

export const NAVIGATION_KEYS = [
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "up",
  "down",
  "left",
  "right", // Aliases
  "home",
  "end",
  "pageup",
  "pagedown",
] as const

export type NavigationKey = (typeof NAVIGATION_KEYS)[number]

// ─────────────────────────────────────────────────────────────────────────────
// SPECIAL KEYS - Enter, Escape, Space, etc.
// ─────────────────────────────────────────────────────────────────────────────

export const SPECIAL_KEYS = [
  "enter",
  "return",
  "escape",
  "esc",
  "space",
  " ",
  "tab",
  "backspace",
  "delete",
  "del",
  "insert",
  "ins",
  "capslock",
  "caps",
  "numlock",
  "scrolllock",
  "pause",
  "break",
  "printscreen",
  "prtsc",
  "contextmenu",
] as const

export type SpecialKey = (typeof SPECIAL_KEYS)[number]

// ─────────────────────────────────────────────────────────────────────────────
// PUNCTUATION & SYMBOL KEYS
// ─────────────────────────────────────────────────────────────────────────────

export const SYMBOL_KEYS = [
  "backtick",
  "`",
  "grave",
  "minus",
  "-",
  "dash",
  "equal",
  "=",
  "equals",
  "bracketleft",
  "[",
  "leftbracket",
  "bracketright",
  "]",
  "rightbracket",
  "backslash",
  "\\",
  "semicolon",
  ";",
  "quote",
  "'",
  "apostrophe",
  "comma",
  ",",
  "period",
  ".",
  "dot",
  "slash",
  "/",
  "forwardslash",
] as const

export type SymbolKey = (typeof SYMBOL_KEYS)[number]

// ─────────────────────────────────────────────────────────────────────────────
// NUMPAD KEYS
// ─────────────────────────────────────────────────────────────────────────────

export const NUMPAD_KEYS = [
  "numpad0",
  "numpad1",
  "numpad2",
  "numpad3",
  "numpad4",
  "numpad5",
  "numpad6",
  "numpad7",
  "numpad8",
  "numpad9",
  "numpadadd",
  "numpadsubtract",
  "numpadmultiply",
  "numpaddivide",
  "numpaddecimal",
  "numpadenter",
] as const

export type NumpadKey = (typeof NUMPAD_KEYS)[number]

// ─────────────────────────────────────────────────────────────────────────────
// COMBINED KEY TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ActionKey = AlphaKey | NumericKey | FunctionKey | NavigationKey | SpecialKey | SymbolKey | NumpadKey

export type AnyKey = ModifierAlias | ActionKey

// ─────────────────────────────────────────────────────────────────────────────
// KEY NORMALIZATION MAP
// ─────────────────────────────────────────────────────────────────────────────

export const KEY_ALIASES: Record<string, string> = {
  // Navigation aliases
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright",

  // Special key aliases
  return: "enter",
  esc: "escape",
  " ": "space",
  del: "delete",
  ins: "insert",
  caps: "capslock",
  prtsc: "printscreen",
  break: "pause",

  // Symbol aliases
  "`": "backtick",
  grave: "backtick",
  "-": "minus",
  dash: "minus",
  "=": "equal",
  equals: "equal",
  "[": "bracketleft",
  leftbracket: "bracketleft",
  "]": "bracketright",
  rightbracket: "bracketright",
  "\\": "backslash",
  ";": "semicolon",
  "'": "quote",
  apostrophe: "quote",
  ",": "comma",
  ".": "period",
  dot: "period",
  "/": "slash",
  forwardslash: "slash",
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function isModifier(key: string): key is ModifierAlias {
  return key.toLowerCase() in MODIFIER_KEYS
}

export function normalizeModifier(key: string): NormalizedModifier {
  const lower = key.toLowerCase()
  return (MODIFIER_KEYS as Record<string, NormalizedModifier>)[lower] ?? (lower as NormalizedModifier)
}

export function normalizeKey(key: string): string {
  const lower = key.toLowerCase()
  return KEY_ALIASES[lower] ?? lower
}
