"use client"

/**
 * ============================================================================
 * useShortcut - Chainable Keyboard Shortcut Hook
 * ============================================================================
 *
 * A developer-friendly, chainable API for keyboard shortcuts with:
 * - Perfect TypeScript intellisense at every step
 * - Cross-platform modifier support (mod = cmd on Mac, ctrl on Windows)
 * - Optional delay, debug mode, and fine-grained control
 * - Automatic cleanup on unmount
 * - Deduplication: re-registering same shortcut updates instead of duplicating
 *
 * @example Basic usage
 * \`\`\`tsx
 * const $ = useShortcut()
 *
 * $.cmd.shift.key("s").on(() => {
 *   console.log("Save triggered!")
 * })
 * \`\`\`
 *
 * @example With options
 * \`\`\`tsx
 * const $ = useShortcut({ debug: true, delay: 100 })
 *
 * $.mod.key("k").on(openCommandPalette, {
 *   description: "Open command palette",
 *   preventDefault: true,
 * })
 * \`\`\`
 */

import { useEffect, useRef, useMemo } from "react"
import { createShortcutBuilder } from "./builder"
import type { ShortcutBuilder, UseShortcutOptions } from "./types"

// ─────────────────────────────────────────────────────────────────────────────
// HOOK IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

export function useShortcut(options: UseShortcutOptions = {}): ShortcutBuilder {
  const optionsRef = useRef(options)
  optionsRef.current = options

  const { builder, registry } = useMemo(() => {
    return createShortcutBuilder(optionsRef.current)
  }, [])

  useEffect(() => {
    registry.options = optionsRef.current
  })

  useEffect(() => {
    return () => {
      registry.listeners.forEach((entry) => entry.unbind())
      registry.listeners.clear()
    }
  }, [registry])

  return builder as ShortcutBuilder
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVENIENCE FACTORY (for non-React usage)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a shortcut builder outside of React (vanilla JS)
 * Remember to call .unbind() to clean up!
 */
export function createShortcut(options: UseShortcutOptions = {}): ShortcutBuilder {
  const { builder } = createShortcutBuilder(options)
  return builder as ShortcutBuilder
}
