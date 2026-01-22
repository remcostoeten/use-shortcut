import type { PlatformType } from "./constants"

export type ModifierState = {
  meta: boolean
  ctrl: boolean
  alt: boolean
  shift: boolean
}

export type ParsedShortcut = {
  modifiers: ModifierState
  key: string
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
