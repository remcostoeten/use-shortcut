import type { Milliseconds, MonotonicTime, Nullable } from "../types/semantic"

/**
 * @name isDue
 * @description Reports whether a deadline has been reached. A deadline is due the moment `now`
 * equals it, which is the one rule every timeout, wait and hold threshold follows.
 *
 * @example
 * if (isDue(now, hold.deadline)) fireStart()
 */
export function isDue(now: MonotonicTime, deadline: MonotonicTime): boolean {
    return now >= deadline
}

/**
 * @name delayUntil
 * @description Converts a deadline into a delay a timer can take. A deadline in the past gives zero,
 * never a negative delay.
 *
 * @example
 * setTimeout(tick, delayUntil(deadline, performance.now()))
 */
export function delayUntil(deadline: MonotonicTime, now: MonotonicTime): Milliseconds {
    return Math.max(0, deadline - now)
}

/**
 * @name earliest
 * @description Picks the first deadline out of a list, or null when there is none to wait for.
 *
 * @example
 * const next = earliest([holdDeadline, sequenceDeadline])
 */
export function earliest(deadlines: readonly MonotonicTime[]): Nullable<MonotonicTime> {
    return deadlines.length > 0 ? Math.min(...deadlines) : null
}
