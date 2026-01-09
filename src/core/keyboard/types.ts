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

/**
 * Shortcut definition with handler
 */
export interface ShortcutDefinition {
  /** Shortcut string (e.g., "cmd+s", "ctrl+shift+p") */
  shortcut: string | string[]
  /** Handler function called when shortcut is triggered */
  handler: (event: KeyboardEvent) => void
  /** Description for accessibility/documentation */
  description?: string
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean
  /** Whether to stop event propagation */
  stopPropagation?: boolean
  /** Only trigger when this element or its children are focused */
  scope?: "global" | "local"
  /** Disable this shortcut */
  disabled?: boolean
}

/**
 * Configuration options for the keyboard hook
 */
export interface KeyboardShortcutOptions {
  /** Enable/disable all shortcuts */
  enabled?: boolean
  /** Target element (defaults to window) */
  target?: HTMLElement | Window | null
  /** Event type to listen for */
  eventType?: "keydown" | "keyup"
  /** Ignore shortcuts when focused on form elements */
  ignoreFormElements?: boolean
  /** Custom form element tags to ignore */
  ignoredTags?: string[]
  /** Override platform detection */
  platform?: PlatformType
}

/**
 * Return type for the useKeyboardShortcuts hook
 */
export interface UseKeyboardShortcutsReturn {
  /** Currently active platform */
  platform: PlatformType
  /** Format a shortcut for display */
  formatShortcut: (shortcut: string) => string
  /** Check if a shortcut is currently enabled */
  isEnabled: (shortcut: string) => boolean
  /** Programmatically trigger a shortcut handler */
  trigger: (shortcut: string) => void
}

/**
 * Shortcut registry entry for internal tracking
 */
export interface ShortcutRegistryEntry extends ParsedShortcut {
  definition: ShortcutDefinition
  id: string
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
