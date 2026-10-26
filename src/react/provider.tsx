import { useContext, useEffect, useLayoutEffect, useState } from "react"
import type {
    CSSProperties,
    KeyboardEvent as ReactKeyboardEvent,
    ReactElement,
    ReactNode,
} from "react"
import type { RegistryOptions } from "../registry/registry"
import { warnInDev } from "../shared/helpers/dev"
import { detectPlatform } from "../shared/helpers/environment"
import type { Combo, Milliseconds, Nullable, Platform, Scope } from "../shared/types/semantic"
import { RegionContext, createRegion } from "./context"
import { isInherited } from "./events"

export type ShortcutProviderProps = {
    scopes?: readonly Scope[]
    inherit?: readonly Combo[]
    sequenceTimeout?: Milliseconds
    holdThreshold?: Milliseconds
    platform?: Platform
    children: ReactNode
}

const CONTENTS: CSSProperties = { display: "contents" }
const NO_COMBOS: readonly Combo[] = []

function isUnfocused(target: Nullable<EventTarget>): boolean {
    return target === document.body || target === document.documentElement
}

/**
 * @name ShortcutProvider
 * @description Owns one registry for the React tree below it. Keys reach that registry only when
 * React delivers them through this provider, which includes portals rendered inside it. A nested
 * provider is an isolated region: its bindings never fire outside it, and outer bindings do not fire
 * inside it unless their combo is listed in `inherit`. The outermost provider also receives keys
 * pressed while nothing on the page has focus. `scopes`, `sequenceTimeout` and `holdThreshold` are
 * read once at mount.
 *
 * @example
 * <ShortcutProvider scopes={["app"]}>
 *     <App />
 * </ShortcutProvider>
 */
export function ShortcutProvider(props: ShortcutProviderProps): ReactElement {
    const parent = useContext(RegionContext)
    const [region] = useState(() => createRegion(parent, props.platform ?? detectPlatform()))
    const [options] = useState<RegistryOptions>(() => ({
        ...(props.scopes && { scopes: props.scopes }),
        ...(props.sequenceTimeout !== undefined && { sequenceTimeout: props.sequenceTimeout }),
        ...(props.holdThreshold !== undefined && { holdThreshold: props.holdThreshold }),
    }))
    const inherit = props.inherit ?? NO_COMBOS
    const inheritKey = inherit.join("\n")

    useLayoutEffect(() => {
        region.setInherit(inherit)
    })

    useLayoutEffect(() => {
        const unmount = region.mount(options)
        if (region.parent !== null) return unmount
        function onWindowKey(event: Event) {
            if (event instanceof KeyboardEvent && isUnfocused(event.target)) region.handle(event)
        }
        window.addEventListener("keydown", onWindowKey)
        window.addEventListener("keyup", onWindowKey)
        return () => {
            window.removeEventListener("keydown", onWindowKey)
            window.removeEventListener("keyup", onWindowKey)
            unmount()
        }
    }, [region, options])

    useEffect(() => {
        let cancelled = false
        Promise.resolve().then(() => {
            if (cancelled || inheritKey === "") return
            const outer = new Set(region.parent?.registry.list().map((info) => info.combo))
            inheritKey
                .split("\n")
                .filter((combo) => !outer.has(combo))
                .forEach((combo) => {
                    warnInDev(`use-shortcut: inherit lists "${combo}" but no outer binding has it`)
                })
        })
        return () => {
            cancelled = true
        }
    }, [region, inheritKey])

    function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
        region.handle(event.nativeEvent)
        if (!isInherited(region.inherit(), event.nativeEvent)) event.stopPropagation()
    }

    function onKeyUp(event: ReactKeyboardEvent<HTMLDivElement>) {
        region.handle(event.nativeEvent)
    }

    return (
        <RegionContext.Provider value={region}>
            <div style={CONTENTS} onKeyDown={onKeyDown} onKeyUp={onKeyUp}>
                {props.children}
            </div>
        </RegionContext.Provider>
    )
}
