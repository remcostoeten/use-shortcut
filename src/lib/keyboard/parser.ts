import { ModifierAliases, SpecialKeyMap, detectPlatform, Platform } from "./constants"
import type { ModifierState, ParsedShortcut } from "./types"

// ─────────────────────────────────────────────────────────────────────────────
// SHORTCUT PARSER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parses a human-readable shortcut string into a structured format
 *
 * @example
 * parseShortcut("cmd+s")        → { modifiers: { meta: true, ... }, key: "s" }
 * parseShortcut("ctrl+shift+p") → { modifiers: { ctrl: true, shift: true, ... }, key: "p" }
 * parseShortcut("⌘+⇧+enter")    → { modifiers: { meta: true, shift: true, ... }, key: "Enter" }
 */
export function parseShortcut(shortcut: string): ParsedShortcut {
  const platform = detectPlatform()

  // Normalize the shortcut string
  const normalized = shortcut.toLowerCase().trim()

  // Split by common separators: +, -, space (but not inside key names)
  const parts = normalized.split(/[\s+-]+/).filter(Boolean)

  if (parts.length === 0) {
    throw new Error(`Invalid shortcut: "${shortcut}"`)
  }

  // Initialize modifier state
  const modifiers: ModifierState = {
    meta: false,
    ctrl: false,
    alt: false,
    shift: false,
  }

  // The last part is always the key, everything else is a modifier
  let key = parts.pop()!

  // Process modifiers
  for (const part of parts) {
    const modifierKey = ModifierAliases[part]

    if (modifierKey) {
      // Handle "mod" specially - it's Meta on Mac, Ctrl on Windows/Linux
      if (part === "mod") {
        if (platform === Platform.MAC) {
          modifiers.meta = true
        } else {
          modifiers.ctrl = true
        }
      } else {
        modifiers[modifierKey] = true
      }
    } else {
      // If it's not a known modifier, treat it as part of the key
      key = part + key
    }
  }

  // Normalize the key
  const normalizedKey = SpecialKeyMap[key] || key

  return {
    modifiers,
    key: normalizedKey.length === 1 ? normalizedKey.toLowerCase() : normalizedKey,
    original: shortcut,
  }
}

/**
 * Parses multiple shortcut strings (for shortcuts with aliases)
 */
export function parseShortcuts(shortcuts: string | string[]): ParsedShortcut[] {
  const shortcutArray = Array.isArray(shortcuts) ? shortcuts : [shortcuts]
  return shortcutArray.map(parseShortcut)
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT MATCHING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts modifier state from a keyboard event
 */
export function getModifiersFromEvent(event: KeyboardEvent): ModifierState {
  return {
    meta: event.metaKey,
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
  }
}

/**
 * Checks if a keyboard event matches a parsed shortcut
 */
export function matchesShortcut(event: KeyboardEvent, parsed: ParsedShortcut): boolean {
  const eventModifiers = getModifiersFromEvent(event)
  const eventKey = event.key.toLowerCase()

  // Check all modifiers match exactly
  const modifiersMatch =
    eventModifiers.meta === parsed.modifiers.meta &&
    eventModifiers.ctrl === parsed.modifiers.ctrl &&
    eventModifiers.alt === parsed.modifiers.alt &&
    eventModifiers.shift === parsed.modifiers.shift

  // Check key matches
  const keyMatches = eventKey === parsed.key.toLowerCase()

  return modifiersMatch && keyMatches
}

/**
 * Checks if any of the parsed shortcuts match the event
 */
export function matchesAnyShortcut(event: KeyboardEvent, parsedShortcuts: ParsedShortcut[]): boolean {
  return parsedShortcuts.some((parsed) => matchesShortcut(event, parsed))
}
