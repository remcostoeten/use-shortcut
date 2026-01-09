/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                     KEYBOARD MODIFIER KEY MAPPING SYSTEM                      ║
 * ║                                                                              ║
 * ║  Enterprise-grade architecture for cross-platform keyboard shortcut handling ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM DETECTION
// ─────────────────────────────────────────────────────────────────────────────

export const Platform = {
  MAC: "mac",
  WINDOWS: "windows",
  LINUX: "linux",
} as const

export type PlatformType = (typeof Platform)[keyof typeof Platform]

export const detectPlatform = (): PlatformType => {
  if (typeof navigator === "undefined") return Platform.WINDOWS
  const platform = navigator.platform.toLowerCase()
  if (platform.includes("mac")) return Platform.MAC
  if (platform.includes("linux")) return Platform.LINUX
  return Platform.WINDOWS
}

// ─────────────────────────────────────────────────────────────────────────────
// MODIFIER KEYS - Internal Representation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Internal modifier key identifiers
 * These are the normalized keys used throughout the system
 */
export const ModifierKey = {
  /** Command on Mac, Ctrl on Windows/Linux */
  META: "meta",
  /** Control key (rarely used alone on Mac) */
  CTRL: "ctrl",
  /** Alt key (Option on Mac) */
  ALT: "alt",
  /** Shift key */
  SHIFT: "shift",
} as const

export type ModifierKeyType = (typeof ModifierKey)[keyof typeof ModifierKey]

// ─────────────────────────────────────────────────────────────────────────────
// EASY LANGUAGE ALIASES → Internal Modifier Mapping
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Human-readable aliases that map to internal modifier keys
 * This allows developers to use intuitive names in their shortcut definitions
 *
 * Example: "command+s" → { meta: true } + "s"
 *          "ctrl+shift+p" → { ctrl: true, shift: true } + "p"
 */
export const ModifierAliases: Record<string, ModifierKeyType> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // META / COMMAND KEY ALIASES
  // ═══════════════════════════════════════════════════════════════════════════
  command: ModifierKey.META,
  cmd: ModifierKey.META,
  "⌘": ModifierKey.META,
  meta: ModifierKey.META,
  win: ModifierKey.META,
  windows: ModifierKey.META,
  super: ModifierKey.META,
  mod: ModifierKey.META, // "mod" = Meta on Mac, Ctrl on Windows/Linux

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTROL KEY ALIASES
  // ═══════════════════════════════════════════════════════════════════════════
  control: ModifierKey.CTRL,
  ctrl: ModifierKey.CTRL,
  "⌃": ModifierKey.CTRL,
  ctl: ModifierKey.CTRL,

  // ═══════════════════════════════════════════════════════════════════════════
  // ALT / OPTION KEY ALIASES
  // ═══════════════════════════════════════════════════════════════════════════
  alt: ModifierKey.ALT,
  option: ModifierKey.ALT,
  opt: ModifierKey.ALT,
  "⌥": ModifierKey.ALT,

  // ═══════════════════════════════════════════════════════════════════════════
  // SHIFT KEY ALIASES
  // ═══════════════════════════════════════════════════════════════════════════
  shift: ModifierKey.SHIFT,
  "⇧": ModifierKey.SHIFT,
  shft: ModifierKey.SHIFT,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// SPECIAL KEY MAPPINGS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps human-readable key names to their actual keyboard event key values
 */
export const SpecialKeyMap: Record<string, string> = {
  // Navigation Keys
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  home: "Home",
  end: "End",
  pageup: "PageUp",
  pagedown: "PageDown",

  // Editing Keys
  enter: "Enter",
  return: "Enter",
  space: " ",
  spacebar: " ",
  tab: "Tab",
  backspace: "Backspace",
  delete: "Delete",
  del: "Delete",
  escape: "Escape",
  esc: "Escape",

  // Function Keys
  f1: "F1",
  f2: "F2",
  f3: "F3",
  f4: "F4",
  f5: "F5",
  f6: "F6",
  f7: "F7",
  f8: "F8",
  f9: "F9",
  f10: "F10",
  f11: "F11",
  f12: "F12",

  // Punctuation (for clarity)
  plus: "+",
  minus: "-",
  comma: ",",
  period: ".",
  slash: "/",
  backslash: "\\",
  bracket: "[",
  closebracket: "]",
} as const

// ─────────────────────────────────────────────────────────────────────────────
// DISPLAY SYMBOLS - Platform-specific rendering
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Display symbols for rendering shortcuts in the UI
 */
export const ModifierDisplaySymbols: Record<PlatformType, Record<ModifierKeyType, string>> = {
  [Platform.MAC]: {
    [ModifierKey.META]: "⌘",
    [ModifierKey.CTRL]: "⌃",
    [ModifierKey.ALT]: "⌥",
    [ModifierKey.SHIFT]: "⇧",
  },
  [Platform.WINDOWS]: {
    [ModifierKey.META]: "Ctrl",
    [ModifierKey.CTRL]: "Ctrl",
    [ModifierKey.ALT]: "Alt",
    [ModifierKey.SHIFT]: "Shift",
  },
  [Platform.LINUX]: {
    [ModifierKey.META]: "Super",
    [ModifierKey.CTRL]: "Ctrl",
    [ModifierKey.ALT]: "Alt",
    [ModifierKey.SHIFT]: "Shift",
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// MODIFIER ORDER - For consistent display
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standard modifier display order (matches OS conventions)
 * Mac: ⌃ ⌥ ⇧ ⌘ (Control, Option, Shift, Command)
 * Windows/Linux: Ctrl + Alt + Shift + Key
 */
export const ModifierDisplayOrder: Record<PlatformType, ModifierKeyType[]> = {
  [Platform.MAC]: [ModifierKey.CTRL, ModifierKey.ALT, ModifierKey.SHIFT, ModifierKey.META],
  [Platform.WINDOWS]: [ModifierKey.META, ModifierKey.ALT, ModifierKey.SHIFT, ModifierKey.CTRL],
  [Platform.LINUX]: [ModifierKey.META, ModifierKey.ALT, ModifierKey.SHIFT, ModifierKey.CTRL],
} as const
