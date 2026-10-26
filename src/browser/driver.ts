import { IDLE_STATE, advanceTime, handleKey, interrupt, nextDeadline } from "../core/matcher"
import type { Fired, KeyInput, MatchResult, Matcher, MatcherState } from "../core/matcher"
import type { BindingID } from "../shared/types/semantic"
import { delayUntil } from "../shared/helpers/time"
import type { KeyPhase, MonotonicTime, Nullable } from "../shared/types/semantic"
import { toKeyInput } from "./input"

/** Where the driver listens. The React layer passes a provider element, plain apps use the window. */
export type ListenTarget = Window | HTMLElement

export type DriverOptions = {
    matcher: Matcher
    target?: ListenTarget
    now?: () => MonotonicTime
    onFired: (fired: readonly Fired[], event: Nullable<KeyboardEvent>) => boolean
    shouldHandle?: (event: KeyboardEvent) => boolean
    shouldPrevent?: (holds: readonly BindingID[], event: KeyboardEvent) => boolean
}

export type Driver = {
    setMatcher: (matcher: Matcher) => void
    interrupt: () => void
    destroy: () => void
}

function defaultNow(): MonotonicTime {
    return performance.now()
}

/**
 * @name createDriver
 * @description Connects the pure matcher to the browser. It listens for `keydown` and `keyup` on one
 * target, keeps a single timer aimed at the matcher's next deadline, calls `preventDefault` when a
 * keydown completes a match that `onFired` reports as handled or begins a hold that `shouldPrevent`
 * accepts, and interrupts on window blur and when the tab is hidden, so no hold
 * gets stuck. Nothing touches `window` until this is called, so importing it is safe during server
 * rendering.
 *
 * @example
 * const driver = createDriver({
 *     matcher,
 *     onFired: (fired) => fired.some((hit) => handlers.get(hit.binding)?.(hit) !== undefined),
 *     shouldHandle: (event) => !isTextTarget(event.target),
 * })
 * driver.destroy()
 */
export function createDriver(options: DriverOptions): Driver {
    const now = options.now ?? defaultNow
    const target: ListenTarget = options.target ?? window
    const shouldHandle = options.shouldHandle ?? (() => true)
    let matcher = options.matcher
    let state: MatcherState = IDLE_STATE
    let timer: Nullable<ReturnType<typeof setTimeout>> = null
    let destroyed = false

    function arm() {
        if (timer !== null) clearTimeout(timer)
        timer = null
        const deadline = nextDeadline(matcher, state)
        if (deadline === null) return
        timer = setTimeout(tick, delayUntil(deadline, now()))
    }

    function apply(result: MatchResult, event: Nullable<KeyboardEvent>) {
        state = result.state
        const handled = result.fired.length > 0 && options.onFired(result.fired, event)
        const holding =
            event !== null &&
            result.holds.length > 0 &&
            (options.shouldPrevent?.(result.holds, event) ?? true)
        if (result.prevent && (handled || holding) && event) event.preventDefault()
        arm()
    }

    function tick() {
        timer = null
        apply(advanceTime(matcher, state, now()), null)
    }

    function feed(event: KeyboardEvent, phase: KeyPhase) {
        const input: KeyInput = { ...toKeyInput(event, phase), time: now() }
        apply(handleKey(matcher, state, input), event)
    }

    function onKeyDown(event: Event) {
        if (!(event instanceof KeyboardEvent)) return
        if (shouldHandle(event)) feed(event, "down")
        else onInterrupt()
    }

    function onKeyUp(event: Event) {
        if (event instanceof KeyboardEvent) feed(event, "up")
    }

    function onInterrupt() {
        apply(interrupt(state, now()), null)
    }

    function onVisibilityChange() {
        if (document.visibilityState === "hidden") onInterrupt()
    }

    function listen(on: boolean) {
        const method = on ? "addEventListener" : "removeEventListener"
        target[method]("keydown", onKeyDown)
        target[method]("keyup", onKeyUp)
        window[method]("blur", onInterrupt)
        document[method]("visibilitychange", onVisibilityChange)
    }

    listen(true)

    return {
        setMatcher: (next) => {
            matcher = next
            state = IDLE_STATE
            arm()
        },
        interrupt: onInterrupt,
        destroy: () => {
            if (destroyed) return
            destroyed = true
            listen(false)
            if (timer !== null) clearTimeout(timer)
            timer = null
        },
    }
}
