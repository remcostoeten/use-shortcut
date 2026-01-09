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

// Types - Legacy
export type {
  ModifierState,
  ParsedShortcut,
  ShortcutDefinition,
  KeyboardShortcutOptions,
  UseKeyboardShortcutsReturn,
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

export { useKeyboardShortcuts } from "./use-keyboard-shortcuts"
export { useShortcut, createShortcut } from "./use-shortcut"
