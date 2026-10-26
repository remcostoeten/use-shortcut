import { createChain } from "../chain/chain"
import type { Shortcut } from "../chain/stages"
import type { Host, Scope } from "../shared/types/semantic"
import { ShortcutBoundary } from "./boundary"
import { useBinding, useShortcutList } from "./hooks"
import { ShortcutProvider } from "./provider"

type Props<S extends readonly Scope[]> = { scopes?: S }

export type ReactShortcuts<S extends readonly Scope[]> = {
    shortcut: Shortcut<S[number] | Host>
    ShortcutProvider: typeof ShortcutProvider
    ShortcutBoundary: typeof ShortcutBoundary
    useShortcutList: typeof useShortcutList
}

/**
 * @name createShortcuts
 * @description The React entry. Call it once in a module and export the result. `shortcut` is the
 * typed chain whose `.on()` is a hook: call it unconditionally in a component body, it registers
 * in an effect, always runs the latest handler and unbinds on unmount. Scope names in `.in()` are
 * the literal union of `scopes`.
 *
 * @example
 * export const { shortcut, ShortcutProvider } = createShortcuts({ scopes: ["app", "editor"] })
 *
 * function Palette() {
 *     const handle = shortcut.mod.key("k").in("app").on(() => setOpen(true))
 *     return <kbd>{handle.display}</kbd>
 * }
 */
export function createShortcuts<const S extends readonly Scope[] = []>(
    options: Props<S> = {},
): ReactShortcuts<S> {
    const scopes: S | readonly [] = options.scopes ?? []
    return {
        shortcut: createChain(scopes, useBinding),
        ShortcutProvider,
        ShortcutBoundary,
        useShortcutList,
    }
}
