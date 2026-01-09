/**
 * ============================================================================
 * useShortcut - Public API
 * ============================================================================
 */

// Main hook
export { useShortcut, createShortcut } from "./hook"

// Types
export type {
  // Key types
  AlphaKey,
  NumericKey,
  FunctionKey,
  NavigationKey,
  SpecialKey,
  SymbolKey,
  ActionKey,
  // Modifier types
  ModifierName,
  ModifierFlags,
  // Handler types
  ShortcutHandler,
  HandlerOptions,
  // Builder types
  ShortcutBuilder,
  ShortcutResult,
  ModifierChain,
  KeyChain,
  // Options
  UseShortcutOptions,
} from "./types"
