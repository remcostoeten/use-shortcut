"use client"

import { useEffect, useRef, useMemo } from "react"
import { createShortcutBuilder } from "./builder"
import type { ShortcutBuilder, UseShortcutOptions } from "./types"

/**
 * React hook for registering chainable keyboard shortcuts
 *
 * @param options - Configuration options for the hook
 * @returns A chainable shortcut builder (`$`)
 *
 * @example
 * ```tsx
 * function App() {
 *   const $ = useShortcut()
 *
 *   $.mod.key("s").on(() => save())
 *   $.ctrl.shift.key("p").on(() => openPalette())
 *   $.key("/").except("typing").on(() => focusSearch())
 *
 *   return <div>Press ⌘S to save</div>
 * }
 * ```
 */
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

/**
 * Create a shortcut builder for non-React usage
 *
 * Unlike `useShortcut`, this does not auto-cleanup - you must call `.unbind()` manually.
 *
 * @param options - Configuration options
 * @returns A chainable shortcut builder
 *
 * @example
 * ```ts
 * const $ = createShortcut()
 * const save = $.mod.key("s").on(() => save())
 *
 * // Cleanup when done
 * save.unbind()
 * ```
 */
export function createShortcut(options: UseShortcutOptions = {}): ShortcutBuilder {
    const { builder } = createShortcutBuilder(options)
    return builder as ShortcutBuilder
}

