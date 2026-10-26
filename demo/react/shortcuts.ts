import { createShortcuts } from "@remcostoeten/use-shortcut/react"

export const { shortcut, ShortcutProvider, ShortcutBoundary, useShortcutList } = createShortcuts({
    scopes: ["editor"],
})
