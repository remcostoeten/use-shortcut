import { canonicalKeyName, isKeyName, resolveKey } from "../core/keys"
import type { Combo, KeyName } from "../shared/types/semantic"

type Held = (event: KeyboardEvent) => boolean

const HELD: ReadonlyMap<string, Held> = new Map<string, Held>([
    ["mod", (event) => event.ctrlKey || event.metaKey],
    ["ctrl", (event) => event.ctrlKey],
    ["meta", (event) => event.metaKey],
    ["alt", (event) => event.altKey],
    ["shift", (event) => event.shiftKey],
    ["lshift", (event) => event.shiftKey],
    ["rshift", (event) => event.shiftKey],
])

function stepMatches(step: string, names: readonly KeyName[], event: KeyboardEvent): boolean {
    const parts = step.replace(/^hold /, "").split("+")
    const key = parts.pop() ?? ""
    if (!isKeyName(key) || !names.includes(canonicalKeyName(key))) return false
    return parts.every((modifier) => HELD.get(modifier)?.(event) ?? false)
}

/**
 * @name forwardKey
 * @description Replays a key event that React delivered on a provider's wrapper onto the detached
 * element the provider's registry listens on. The copy keeps the original target so the skip rules
 * still see the real element, and `preventDefault` on the copy is carried back to the original.
 *
 * @example
 * forwardKey(event.nativeEvent, proxy)
 */
export function forwardKey(event: KeyboardEvent, target: HTMLElement): void {
    const copy = new KeyboardEvent(event.type, {
        key: event.key,
        code: event.code,
        location: event.location,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        metaKey: event.metaKey,
        repeat: event.repeat,
        isComposing: event.isComposing,
        cancelable: true,
    })
    // dispatched on a detached element, so the target must point at the real element for the skip rules
    Object.defineProperty(copy, "target", { value: event.target })
    target.dispatchEvent(copy)
    if (copy.defaultPrevented) event.preventDefault()
}

/**
 * @name isInherited
 * @description Decides whether a keydown inside a nested provider may continue to the outer one:
 * true when its key and held modifiers match any step of a combo listed in `inherit`.
 *
 * @example
 * isInherited(["mod+k then s"], event) // true for Ctrl+K and for S
 */
export function isInherited(combos: readonly Combo[], event: KeyboardEvent): boolean {
    const names = resolveKey(event.key).map((resolved) => resolved.name)
    return combos.some((combo) =>
        combo.split(" then ").some((step) => stepMatches(step, names, event)),
    )
}
