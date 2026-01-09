// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

// Constants
export {
  ModifierKey,
  ModifierAliases,
  SpecialKeyMap,
  ModifierDisplaySymbols,
  ModifierDisplayOrder,
  Platform,
  detectPlatform,
} from "./constants"

// Core Library Types
export type {
  ModifierState,
  ParsedShortcut,
} from "./types"

export type {
  ShortcutBuilder,
  ShortcutResult,
  ShortcutHandler,
  HandlerOptions,
  UseShortcutOptions,
  ActionKey,
  ModifierName,
  ModifierFlags,
  AlphaKey,
  NumericKey,
  FunctionKey,
  NavigationKey,
  SpecialKey,
  SymbolKey,
  ModifierChain,
  KeyChain,
} from "./use-shortcut"

// Parser
export {
  parseShortcut,
  parseShortcuts,
  getModifiersFromEvent,
  matchesShortcut,
  matchesAnyShortcut,
} from "./parser"

// Formatter
export { formatShortcut, getModifierSymbols } from "./formatter"

export { useShortcut, createShortcut } from "./use-shortcut"
