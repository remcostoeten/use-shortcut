import type { KeyInput } from "../core/matcher"
import type { KeyPhase, KeySide, Nullable } from "../shared/types/semantic"

const LEFT_LOCATION = 1
const RIGHT_LOCATION = 2

function sideOf(location: number): Nullable<KeySide> {
    if (location === LEFT_LOCATION) return "left"
    if (location === RIGHT_LOCATION) return "right"
    return null
}

/**
 * @name toKeyInput
 * @description Converts a browser `KeyboardEvent` into the plain key input the matcher understands.
 * The event's own `timeStamp` is used as the monotonic time, so key events and `performance.now()`
 * share one clock.
 *
 * @example
 * window.addEventListener("keydown", (event) => handleKey(matcher, state, toKeyInput(event, "down")))
 */
export function toKeyInput(event: KeyboardEvent, phase: KeyPhase): KeyInput {
    return {
        phase,
        key: event.key,
        code: event.code,
        location: sideOf(event.location),
        ctrl: event.ctrlKey,
        alt: event.altKey,
        meta: event.metaKey,
        shift: event.shiftKey,
        repeat: event.repeat,
        composing: event.isComposing,
        time: event.timeStamp,
    }
}
