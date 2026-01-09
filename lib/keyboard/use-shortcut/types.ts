/**
 * ============================================================================
 * CHAINABLE KEYBOARD SHORTCUT TYPES
 * ============================================================================
 *
 * Type definitions for the chainable keyboard shortcut builder.
 * Designed for perfect TypeScript intellisense at every step.
 */

// ─────────────────────────────────────────────────────────────────────────────
// KEY LITERAL TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** All alpha keys A-Z */
export type AlphaKey =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  | "p"
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z"

/** Numeric keys 0-9 */
export type NumericKey = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

/** Function keys F1-F12 */
export type FunctionKey = "f1" | "f2" | "f3" | "f4" | "f5" | "f6" | "f7" | "f8" | "f9" | "f10" | "f11" | "f12"

/** Navigation keys */
export type NavigationKey =
  | "up"
  | "down"
  | "left"
  | "right"
  | "arrowup"
  | "arrowdown"
  | "arrowleft"
  | "arrowright"
  | "home"
  | "end"
  | "pageup"
  | "pagedown"

/** Special action keys */
export type SpecialKey =
  | "enter"
  | "return"
  | "escape"
  | "esc"
  | "space"
  | "tab"
  | "backspace"
  | "delete"
  | "del"
  | "insert"

/** Symbol keys */
export type SymbolKey =
  | "minus"
  | "plus"
  | "equal"
  | "equals"
  | "bracketleft"
  | "bracketright"
  | "backslash"
  | "slash"
  | "/"
  | "comma"
  | "period"
  | "semicolon"
  | "quote"
  | "backtick"

/** All possible action keys (non-modifiers) */
export type ActionKey = AlphaKey | NumericKey | FunctionKey | NavigationKey | SpecialKey | SymbolKey

// ─────────────────────────────────────────────────────────────────────────────
// MODIFIER TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** Canonical modifier names */
export type ModifierName = "ctrl" | "shift" | "alt" | "cmd" | "mod"

/** Modifier state tracking for the builder */
export interface ModifierFlags {
  ctrl: boolean
  shift: boolean
  alt: boolean
  cmd: boolean
}

/** Default modifier state (all false) */
export type EmptyModifiers = {
  ctrl: false
  shift: false
  alt: false
  cmd: false
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** Shortcut handler function */
export type ShortcutHandler = (event: KeyboardEvent) => void

/** Predicate to determine if shortcut should be skipped */
export type ExceptPredicate = (event: KeyboardEvent) => boolean

/** Built-in exception presets */
export type ExceptPreset =
  | "input" // Skip when in input/textarea/select
  | "editable" // Skip when in contenteditable
  | "typing" // Skip when in any text input context (input + editable)
  | "modal" // Skip when a modal is open (checks for [data-modal])
  | "disabled" // Skip when element has [disabled] or [aria-disabled]

/** Handler options for fine-grained control */
export interface HandlerOptions {
  /** Prevent default browser behavior (default: true) */
  preventDefault?: boolean
  /** Stop event propagation (default: false) */
  stopPropagation?: boolean
  /** Delay in ms before triggering (default: 0) */
  delay?: number
  /** Description for accessibility */
  description?: string
  /** Disable the shortcut */
  disabled?: boolean
  /** Only trigger when specific element is focused */
  scope?: HTMLElement | null
  /** Conditions to skip triggering */
  except?: ExceptPreset | ExceptPreset[] | ExceptPredicate
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILDER RESULT TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** The final result after calling .on() */
export interface ShortcutResult {
  /** Unsubscribe from the shortcut */
  unbind: () => void
  /** The formatted shortcut string for display */
  display: string
  /** The raw shortcut combo */
  combo: string
  /** Trigger the handler programmatically */
  trigger: () => void
  /** Check if the shortcut is currently enabled */
  isEnabled: boolean
  /** Enable the shortcut */
  enable: () => void
  /** Disable the shortcut */
  disable: () => void
  /** Subscribe to match attempts (for UI feedback) */
  onAttempt?: (callback: (matched: boolean, event: KeyboardEvent) => void) => () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILDER CHAIN TYPES - The magic for intellisense
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes which modifiers are still available to chain
 * If ctrl is already pressed, remove it from options
 */
export type RemainingModifiers<Used extends Partial<ModifierFlags>> = Exclude<
  ModifierName,
  | (Used extends { ctrl: true } ? "ctrl" : never)
  | (Used extends { shift: true } ? "shift" : never)
  | (Used extends { alt: true } ? "alt" : never)
  | (Used extends { cmd: true } ? "cmd" | "mod" : never)
>

/**
 * Builder interface after selecting a modifier
 * Shows only remaining modifiers + action keys
 */
export interface ModifierChain<Used extends Partial<ModifierFlags>> {
  /** Chain with Ctrl modifier */
  ctrl: Used extends { ctrl: true } ? never : ModifierChain<Used & { ctrl: true }>
  /** Chain with Shift modifier */
  shift: Used extends { shift: true } ? never : ModifierChain<Used & { shift: true }>
  /** Chain with Alt/Option modifier */
  alt: Used extends { alt: true } ? never : ModifierChain<Used & { alt: true }>
  /** Chain with Cmd/Meta modifier */
  cmd: Used extends { cmd: true } ? never : ModifierChain<Used & { cmd: true }>
  /** Chain with Mod (Cmd on Mac, Ctrl on Windows/Linux) */
  mod: Used extends { cmd: true } ? never : ModifierChain<Used & { cmd: true }>

  /** Complete the chain with an action key */
  key: <K extends ActionKey>(key: K) => KeyChain<Used, K>
}

/**
 * Builder interface after selecting the final key
 * Only `.on()` or `.except()` is available here
 */
export interface KeyChain<Used extends Partial<ModifierFlags>, Key extends ActionKey> {
  /** Bind a handler to this shortcut */
  on: (handler: ShortcutHandler, options?: HandlerOptions) => ShortcutResult

  /** Alternative: provide options inline */
  handle: (options: HandlerOptions & { handler: ShortcutHandler }) => ShortcutResult

  /** Skip shortcut under certain conditions */
  except: (condition: ExceptPreset | ExceptPreset[] | ExceptPredicate) => KeyChainWithExcept<Used, Key>
}

/** KeyChain after .except() has been called */
export interface KeyChainWithExcept<Used extends Partial<ModifierFlags>, Key extends ActionKey> {
  /** Bind a handler to this shortcut */
  on: (handler: ShortcutHandler, options?: Omit<HandlerOptions, "except">) => ShortcutResult
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT BUILDER TYPE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The initial builder - all modifiers available
 */
export interface ShortcutBuilder extends ModifierChain<EmptyModifiers> {
  /** Start with Ctrl */
  ctrl: ModifierChain<{ ctrl: true; shift: false; alt: false; cmd: false }>
  /** Start with Shift */
  shift: ModifierChain<{ ctrl: false; shift: true; alt: false; cmd: false }>
  /** Start with Alt/Option */
  alt: ModifierChain<{ ctrl: false; shift: false; alt: true; cmd: false }>
  /** Start with Cmd/Meta */
  cmd: ModifierChain<{ ctrl: false; shift: false; alt: false; cmd: true }>
  /** Start with Mod (cross-platform) */
  mod: ModifierChain<{ ctrl: false; shift: false; alt: false; cmd: true }>
  /** Start directly with a key (no modifiers) */
  key: <K extends ActionKey>(key: K) => KeyChain<EmptyModifiers, K>
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK OPTIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface UseShortcutOptions {
  /** Enable debug logging (default: false) */
  debug?: boolean
  /** Global delay before any handler triggers (default: 0) */
  delay?: number
  /** Ignore shortcuts when in form elements (default: true) */
  ignoreInputs?: boolean
  /** Custom element to attach listener to */
  target?: HTMLElement | Window | null
  /** Event type: keydown or keyup (default: keydown) */
  eventType?: "keydown" | "keyup"
  /** Disable all shortcuts */
  disabled?: boolean
}
