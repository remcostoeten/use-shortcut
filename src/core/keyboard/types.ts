import type { PlatformType } from "./constants"

// ─────────────────────────────────────────────────────────────────────────────
// CORE TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Modifier state extracted from a keyboard event
 */
export interface ModifierState {
  meta: boolean
  ctrl: boolean
  alt: boolean
  shift: boolean
}

/**
 * Parsed representation of a keyboard shortcut
 */
export interface ParsedShortcut {
  /** The modifier keys required */
  modifiers: ModifierState
  /** The primary key (e.g., "s", "Enter", "F1") */
  key: string
  /** Original shortcut string for debugging */
  original: string
}

export type {
  AlphaKey,
  NumericKey,
  FunctionKey,
  NavigationKey,
  SpecialKey,
  SymbolKey,
  ActionKey,
  ModifierName,
  ModifierFlags,
  ShortcutHandler,
  HandlerOptions,
  ShortcutBuilder,
  ShortcutResult,
  ModifierChain,
  KeyChain,
  UseShortcutOptions,
} from "./use-shortcut/types"
