"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { detectPlatform } from "./constants"
import { formatShortcut } from "./formatter"
import { matchesAnyShortcut, parseShortcuts } from "./parser"
import type { KeyboardShortcutOptions, ShortcutDefinition, UseKeyboardShortcutsReturn } from "./types"

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_OPTIONS: Required<KeyboardShortcutOptions> = {
  enabled: true,
  target: typeof window !== "undefined" ? window : null,
  eventType: "keydown",
  ignoreFormElements: true,
  ignoredTags: ["INPUT", "TEXTAREA", "SELECT", "CONTENTEDITABLE"],
  platform: detectPlatform(),
}

// ─────────────────────────────────────────────────────────────────────────────
// KEYBOARD SHORTCUTS HOOK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Enterprise-grade keyboard shortcuts hook with easy language mapping
 *
 * @example
 * \`\`\`tsx
 * useKeyboardShortcuts([
 *   {
 *     shortcut: "cmd+s",        // Works on Mac
 *     // shortcut: "mod+s",     // Cross-platform: ⌘ on Mac, Ctrl on Windows
 *     handler: () => save(),
 *     description: "Save document",
 *     preventDefault: true,
 *   },
 *   {
 *     shortcut: ["ctrl+shift+p", "cmd+shift+p"],  // Multiple shortcuts
 *     handler: () => openCommandPalette(),
 *     description: "Open command palette",
 *   },
 * ]);
 * \`\`\`
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutDefinition[],
  options: KeyboardShortcutOptions = {},
): UseKeyboardShortcutsReturn {
  const opts = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options])

  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  // Parse all shortcuts once
  const parsedShortcutsMap = useMemo(() => {
    return shortcuts.map((def) => ({
      definition: def,
      parsed: parseShortcuts(def.shortcut),
    }))
  }, [shortcuts])

  // Check if element should be ignored (form elements)
  const shouldIgnoreElement = useCallback(
    (target: EventTarget | null): boolean => {
      if (!opts.ignoreFormElements || !target) return false

      const element = target as HTMLElement
      const tagName = element.tagName?.toUpperCase()

      if (opts.ignoredTags.includes(tagName)) return true
      if (element.isContentEditable) return true

      return false
    },
    [opts.ignoreFormElements, opts.ignoredTags],
  )

  // Main event handler
  const handleKeyEvent = useCallback(
    (event: KeyboardEvent) => {
      if (!opts.enabled) return
      if (shouldIgnoreElement(event.target)) return

      for (const { definition, parsed } of parsedShortcutsMap) {
        if (definition.disabled) continue

        if (matchesAnyShortcut(event, parsed)) {
          if (definition.preventDefault !== false) {
            event.preventDefault()
          }

          if (definition.stopPropagation) {
            event.stopPropagation()
          }

          definition.handler(event)
          return
        }
      }
    },
    [opts.enabled, shouldIgnoreElement, parsedShortcutsMap],
  )

  // Attach event listener
  useEffect(() => {
    const target = opts.target
    if (!target || !opts.enabled) return

    target.addEventListener(opts.eventType, handleKeyEvent as EventListener)

    return () => {
      target.removeEventListener(opts.eventType, handleKeyEvent as EventListener)
    }
  }, [opts.target, opts.enabled, opts.eventType, handleKeyEvent])

  // Public API
  const format = useCallback((shortcut: string) => formatShortcut(shortcut, opts.platform), [opts.platform])

  const isEnabled = useCallback((shortcut: string): boolean => {
    const def = shortcutsRef.current.find((s) =>
      Array.isArray(s.shortcut) ? s.shortcut.includes(shortcut) : s.shortcut === shortcut,
    )
    return !!def && !def.disabled
  }, [])

  const trigger = useCallback((shortcut: string): void => {
    const def = shortcutsRef.current.find((s) =>
      Array.isArray(s.shortcut) ? s.shortcut.includes(shortcut) : s.shortcut === shortcut,
    )

    if (def && !def.disabled) {
      def.handler(new KeyboardEvent("keydown"))
    }
  }, [])

  return {
    platform: opts.platform,
    formatShortcut: format,
    isEnabled,
    trigger,
  }
}
