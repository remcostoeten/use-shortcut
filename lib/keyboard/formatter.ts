import {
  ModifierDisplayOrder,
  ModifierDisplaySymbols,
  Platform,
  detectPlatform,
  type ModifierKeyType,
  type PlatformType,
} from "./constants"
import { parseShortcut } from "./parser"

// ─────────────────────────────────────────────────────────────────────────────
// SHORTCUT FORMATTER - For UI Display
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats a shortcut for display in the UI
 *
 * @example
 * // On Mac:
 * formatShortcut("cmd+s")        → "⌘S"
 * formatShortcut("ctrl+shift+p") → "⌃⇧P"
 *
 * // On Windows:
 * formatShortcut("cmd+s")        → "Ctrl+S"
 * formatShortcut("ctrl+shift+p") → "Ctrl+Shift+P"
 */
export function formatShortcut(shortcut: string, platform?: PlatformType): string {
  const targetPlatform = platform ?? detectPlatform()
  const parsed = parseShortcut(shortcut)
  const symbols = ModifierDisplaySymbols[targetPlatform]
  const order = ModifierDisplayOrder[targetPlatform]

  const parts: string[] = []

  // Add modifiers in the correct order for the platform
  for (const modifier of order) {
    if (parsed.modifiers[modifier]) {
      parts.push(symbols[modifier])
    }
  }

  // Format the key
  const displayKey = formatKey(parsed.key, targetPlatform)
  parts.push(displayKey)

  // Use appropriate separator based on platform
  const separator = targetPlatform === Platform.MAC ? "" : "+"

  return parts.join(separator)
}

/**
 * Formats a key for display (uppercase letters, proper names for special keys)
 */
function formatKey(key: string, platform: PlatformType): string {
  // Special key display names
  const displayNames: Record<string, string> = {
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    Enter: platform === Platform.MAC ? "↩" : "Enter",
    Tab: platform === Platform.MAC ? "⇥" : "Tab",
    Escape: platform === Platform.MAC ? "⎋" : "Esc",
    Backspace: platform === Platform.MAC ? "⌫" : "Backspace",
    Delete: platform === Platform.MAC ? "⌦" : "Del",
    " ": platform === Platform.MAC ? "␣" : "Space",
    Home: "Home",
    End: "End",
    PageUp: "PgUp",
    PageDown: "PgDn",
  }

  return displayNames[key] || key.toUpperCase()
}

/**
 * Get all display symbols for a platform (useful for legends/help screens)
 */
export function getModifierSymbols(platform?: PlatformType): Record<ModifierKeyType, string> {
  const targetPlatform = platform ?? detectPlatform()
  return ModifierDisplaySymbols[targetPlatform]
}
