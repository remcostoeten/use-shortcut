import { isModifierKey, physicalKeyName, resolveKey } from "./keys"
import { stepMatches } from "./step"
import type { HeldModifiers, HoldStep } from "./step"
import { earliest, isDue } from "../shared/helpers/time"
import { buildTrie } from "./trie"
import type { BindingInput, TrieNode } from "./trie"
import type {
    BindingID,
    HoldPhase,
    KeyCode,
    KeyName,
    KeyPhase,
    KeyValue,
    KeySide,
    Milliseconds,
    MonotonicTime,
    Nullable,
    Platform,
} from "../shared/types/semantic"

/** One key event in plain data, so the matcher never touches the DOM. */
export type KeyInput = {
    phase: KeyPhase
    key: KeyValue
    code: KeyCode
    location: Nullable<KeySide>
    ctrl: boolean
    alt: boolean
    meta: boolean
    shift: boolean
    repeat: boolean
    composing: boolean
    time: MonotonicTime
}

export type MatcherOptions = {
    platform: Platform
    sequenceTimeout?: Milliseconds
    holdThreshold?: Milliseconds
}

export type Matcher = {
    root: TrieNode
    sequenceTimeout: Milliseconds
}

/** Bindings that matched but wait because a longer sequence could still follow. */
type PendingMatch = {
    bindings: readonly BindingID[]
    deadline: MonotonicTime
}

/** One hold step waiting for, or past, its threshold. */
type HoldTimer = {
    node: TrieNode
    step: HoldStep
    deadline: MonotonicTime
    started: boolean
}

/** A key that is down and matched at least one hold step. `taps` fire instead if it is released early. */
type HoldProgress = {
    keys: readonly KeyName[]
    pressedAt: MonotonicTime
    timers: readonly HoldTimer[]
    taps: readonly TrieNode[]
}

export type MatcherState = {
    active: readonly TrieNode[]
    lastStepAt: Nullable<MonotonicTime>
    pending: Nullable<PendingMatch>
    hold: Nullable<HoldProgress>
    shiftSide: Nullable<KeySide>
}

type PressFired = {
    type: "press"
    binding: BindingID
}

type HoldFired = {
    type: "hold"
    binding: BindingID
    phase: HoldPhase
    duration: Milliseconds
}

/** A binding that fired, with the hold phase and duration when it ends in a hold. */
export type Fired = PressFired | HoldFired

/** `prevent` is true when the keydown completed a match or began a hold; `holds` lists the latter. */
export type MatchResult = {
    state: MatcherState
    fired: readonly Fired[]
    prevent: boolean
    holds: readonly BindingID[]
}

const DEFAULT_SEQUENCE_TIMEOUT: Milliseconds = 1000
const DEFAULT_HOLD_THRESHOLD: Milliseconds = 500

export const IDLE_STATE: MatcherState = {
    active: [],
    lastStepAt: null,
    pending: null,
    hold: null,
    shiftSide: null,
}

function validate(binding: BindingInput, sequenceTimeout: Milliseconds) {
    binding.steps.forEach((step, index) => {
        const minDelay = step.minDelay ?? 0
        if (index === 0 && minDelay > 0)
            throw new Error(`use-shortcut: binding "${binding.id}" starts with a wait`)
        if (minDelay >= sequenceTimeout) {
            throw new Error(
                `use-shortcut: wait in "${binding.id}" must be shorter than the ${sequenceTimeout}ms timeout`,
            )
        }
        if (step.kind === "hold" && step.threshold !== undefined && step.threshold <= 0) {
            throw new Error(`use-shortcut: hold in "${binding.id}" needs a positive threshold`)
        }
    })
}

/**
 * @name createMatcher
 * @description Builds one shared matcher for a set of bindings. Every binding lives in the same trie,
 * so no binding matches on its own. Throws when a wait starts a binding or is not shorter than the
 * sequence timeout.
 *
 * @example
 * const matcher = createMatcher(
 *     [{ id: "dashboard", steps: [{ kind: "press", key: "g", modifiers: [] }, { kind: "press", key: "d", modifiers: [] }] }],
 *     { platform: "mac" },
 * )
 */
export function createMatcher(bindings: readonly BindingInput[], options: MatcherOptions): Matcher {
    const sequenceTimeout = options.sequenceTimeout ?? DEFAULT_SEQUENCE_TIMEOUT
    bindings.forEach((binding) => validate(binding, sequenceTimeout))
    return {
        root: buildTrie(
            bindings,
            options.platform,
            options.holdThreshold ?? DEFAULT_HOLD_THRESHOLD,
        ),
        sequenceTimeout,
    }
}

function pressed(bindings: readonly BindingID[]): readonly Fired[] {
    return bindings.map((binding) => ({ type: "press", binding }))
}

function holdEvents(
    timers: readonly HoldTimer[],
    phase: HoldPhase,
    duration: Milliseconds,
): readonly Fired[] {
    return timers.flatMap((timer) =>
        timer.node.bindings.map((binding) => ({ type: "hold", binding, phase, duration })),
    )
}

function startedTimers(hold: Nullable<HoldProgress>): readonly HoldTimer[] {
    return hold?.timers.filter((timer) => timer.started) ?? []
}

function idle(state: MatcherState): MatcherState {
    const hold = startedTimers(state.hold).length > 0 ? state.hold : null
    return { ...IDLE_STATE, hold, shiftSide: state.shiftSide }
}

function matchChildren(
    from: readonly TrieNode[],
    key: KeyValue,
    held: HeldModifiers,
    elapsed: Nullable<Milliseconds>,
): readonly TrieNode[] {
    return from.flatMap((node) =>
        node.children.filter(
            (child) =>
                child.step !== null &&
                child.step.minDelay <= (elapsed ?? 0) &&
                stepMatches(child.step, key, held),
        ),
    )
}

/**
 * @name nextDeadline
 * @description The time at which `advanceTime` has work to do: a hold reaches its threshold, a waiting
 * binding fires or a sequence expires. Returns null when nothing is in progress. A driver schedules one
 * timer for it.
 *
 * @example
 * const deadline = nextDeadline(matcher, state)
 * if (deadline !== null) setTimeout(tick, deadline - performance.now())
 */
export function nextDeadline(matcher: Matcher, state: MatcherState): Nullable<MonotonicTime> {
    const holds =
        state.hold?.timers.filter((timer) => !timer.started).map((timer) => timer.deadline) ?? []
    const sequence =
        state.active.length > 0 && state.lastStepAt !== null
            ? [state.lastStepAt + matcher.sequenceTimeout]
            : []
    const pending = state.pending ? [state.pending.deadline] : []
    const deadlines = [...holds, ...sequence, ...pending]
    return earliest(deadlines)
}

function startHold(state: MatcherState, hold: HoldProgress, due: HoldTimer): MatchResult {
    const timers = hold.timers.map((timer) => (timer === due ? { ...timer, started: true } : timer))
    const continues = due.node.children.length > 0
    return {
        state: {
            ...state,
            hold: { ...hold, timers, taps: [] },
            active: continues ? [...state.active, due.node] : state.active,
            lastStepAt: null,
        },
        fired: holdEvents([due], "start", due.step.threshold),
        prevent: false,
        holds: [],
    }
}

function advanceOnce(
    matcher: Matcher,
    state: MatcherState,
    now: MonotonicTime,
): Nullable<MatchResult> {
    const deadline = nextDeadline(matcher, state)
    if (deadline === null || !isDue(now, deadline)) return null
    const due = state.hold?.timers.find((timer) => !timer.started && timer.deadline === deadline)
    if (state.hold && due) return startHold(state, state.hold, due)
    return {
        state: idle(state),
        fired: pressed(state.pending?.bindings ?? []),
        prevent: false,
        holds: [],
    }
}

/**
 * @name advanceTime
 * @description Moves the matcher to `now`. Holds that reached their threshold fire `start`, bindings
 * that were waiting fire, and expired sequences reset. Never asks for `preventDefault`.
 *
 * @example
 * const { state: next, fired } = advanceTime(matcher, state, performance.now())
 */
export function advanceTime(
    matcher: Matcher,
    state: MatcherState,
    now: MonotonicTime,
): MatchResult {
    let current = state
    const fired: Fired[] = []
    for (
        let next = advanceOnce(matcher, current, now);
        next;
        next = advanceOnce(matcher, current, now)
    ) {
        current = next.state
        fired.push(...next.fired)
    }
    return { state: current, fired, prevent: false, holds: [] }
}

/**
 * @name interrupt
 * @description Ends every started hold with `release` and resets all progress. Call it on window blur,
 * on `visibilitychange` and when focus moves to another provider, so no hold gets stuck.
 *
 * @example
 * window.addEventListener("blur", () => apply(interrupt(state, performance.now())))
 */
export function interrupt(state: MatcherState, now: MonotonicTime): MatchResult {
    const started = startedTimers(state.hold)
    const duration = state.hold ? now - state.hold.pressedAt : 0
    return {
        state: IDLE_STATE,
        fired: holdEvents(started, "release", duration),
        prevent: false,
        holds: [],
    }
}

function effectiveKey(input: KeyInput): KeyValue {
    return (input.alt && physicalKeyName(input.code)) || input.key
}

function trackShift(state: MatcherState, input: KeyInput): MatcherState {
    if (input.key.toLowerCase() !== "shift")
        return input.shift ? state : { ...state, shiftSide: null }
    return { ...state, shiftSide: input.phase === "down" ? input.location : null }
}

function enter(
    matcher: Matcher,
    state: MatcherState,
    matches: readonly TrieNode[],
    time: MonotonicTime,
): MatchResult {
    const complete = matches.flatMap((node) => node.bindings)
    const continuing = matches.filter((node) => node.children.length > 0)
    if (continuing.length === 0)
        return {
            state: idle(state),
            fired: pressed(complete),
            prevent: complete.length > 0,
            holds: [],
        }
    const pending =
        complete.length > 0
            ? { bindings: complete, deadline: time + matcher.sequenceTimeout }
            : null
    return {
        state: { ...state, active: continuing, lastStepAt: time, pending },
        fired: [],
        prevent: false,
        holds: [],
    }
}

function begin(
    matcher: Matcher,
    state: MatcherState,
    matches: readonly TrieNode[],
    time: MonotonicTime,
): MatchResult {
    const timers = matches.flatMap((node) =>
        node.step?.kind === "hold"
            ? [{ node, step: node.step, deadline: time + node.step.threshold, started: false }]
            : [],
    )
    if (timers.length === 0) return enter(matcher, state, matches, time)
    const taps = matches.filter((node) => node.step?.kind === "press")
    const keys = [...new Set(matches.flatMap((node) => (node.step ? [node.step.key] : [])))]
    const replaced = startedTimers(state.hold)
    const duration = state.hold ? time - state.hold.pressedAt : 0
    return {
        state: {
            ...state,
            active: [],
            lastStepAt: null,
            pending: null,
            hold: { keys, pressedAt: time, timers, taps },
        },
        fired: holdEvents(replaced, "release", duration),
        prevent: true,
        holds: timers.flatMap((timer) => timer.node.bindings),
    }
}

function release(matcher: Matcher, state: MatcherState, input: KeyInput): MatchResult {
    const hold = state.hold
    const unchanged = { state, fired: [], prevent: false, holds: [] }
    if (!hold) return unchanged
    const holdKey = resolveKey(effectiveKey(input)).some((candidate) =>
        hold.keys.includes(candidate.name),
    )
    const metaReleased =
        input.key.toLowerCase() === "meta" && hold.timers.some((timer) => timer.step.meta)
    if (!holdKey && !metaReleased) return unchanged
    const cleared = { ...state, hold: null }
    const started = startedTimers(hold)
    if (started.length > 0) {
        const continues = state.active.length > 0
        return {
            state: continues ? { ...cleared, lastStepAt: input.time } : cleared,
            fired: holdEvents(started, "release", input.time - hold.pressedAt),
            prevent: false,
            holds: [],
        }
    }
    if (hold.taps.length === 0) return { state: cleared, fired: [], prevent: false, holds: [] }
    return { ...enter(matcher, cleared, hold.taps, input.time), prevent: false, holds: [] }
}

/**
 * @name handleKey
 * @description Feeds one key event to the matcher and returns the next state, the bindings that fired
 * and whether to call `preventDefault`. Auto-repeat, IME composition and bare modifier keys never advance
 * a sequence. A wrong key resets progress, and starts a new attempt when it is itself a valid first step.
 * A binding that is also the start of a longer sequence or a hold waits before it fires. A key that
 * matches both a tap and a hold picks the tap when released before the threshold.
 *
 * @example
 * const result = handleKey(matcher, state, input)
 * if (result.prevent) event.preventDefault()
 */
export function handleKey(matcher: Matcher, state: MatcherState, input: KeyInput): MatchResult {
    const expired = advanceTime(matcher, state, input.time)
    const tracked = trackShift(expired.state, input)

    if (input.phase === "up") {
        const released = release(matcher, tracked, input)
        return { ...released, fired: [...expired.fired, ...released.fired] }
    }
    if (input.repeat || input.composing || isModifierKey(input.key)) {
        return { state: tracked, fired: expired.fired, prevent: false, holds: [] }
    }

    const current = startedTimers(tracked.hold).length > 0 ? tracked : { ...tracked, hold: null }
    const held: HeldModifiers = {
        ctrl: input.ctrl,
        alt: input.alt,
        meta: input.meta,
        shift: input.shift,
        shiftSide: current.shiftSide,
    }

    const key = effectiveKey(input)
    if (current.active.length > 0) {
        const continued = matchChildren(
            current.active,
            key,
            held,
            current.lastStepAt === null ? null : input.time - current.lastStepAt,
        )
        if (continued.length > 0) {
            const result = begin(matcher, current, continued, input.time)
            return { ...result, fired: [...expired.fired, ...result.fired] }
        }
    }

    const abandoned = pressed(current.pending?.bindings ?? [])
    const restarted = begin(
        matcher,
        idle(current),
        matchChildren([matcher.root], key, held, null),
        input.time,
    )
    return { ...restarted, fired: [...expired.fired, ...abandoned, ...restarted.fired] }
}
