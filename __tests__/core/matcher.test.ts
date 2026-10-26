import { describe, expect, it } from "bun:test"
import {
    IDLE_STATE,
    advanceTime,
    createMatcher,
    handleKey,
    interrupt,
    nextDeadline,
} from "../../src/core/matcher"
import type { Fired, KeyInput, Matcher, MatcherState } from "../../src/core/matcher"
import type { StepInput } from "../../src/core/step"
import type { BindingInput } from "../../src/core/trie"
import type { BindingID, KeyName, Modifier, Platform } from "../../src/shared/types/semantic"

function step(key: KeyName, ...modifiers: Modifier[]): StepInput {
    return { kind: "press", key, modifiers }
}

function untyped(key: string): StepInput {
    return JSON.parse(JSON.stringify({ kind: "press", key, modifiers: [] }))
}

function hold(key: KeyName, threshold?: number): StepInput {
    return threshold === undefined
        ? { kind: "hold", key, modifiers: [] }
        : { kind: "hold", key, modifiers: [], threshold }
}

function after(minDelay: number, next: StepInput): StepInput {
    return { ...next, minDelay }
}

function binding(id: BindingID, ...steps: BindingInput["steps"]): BindingInput {
    return { id, steps }
}

function down(key: string, time: number, held: Partial<KeyInput> = {}): KeyInput {
    return {
        phase: "down",
        key,
        code: "",
        location: null,
        ctrl: false,
        alt: false,
        meta: false,
        shift: false,
        repeat: false,
        composing: false,
        time,
        ...held,
    }
}

function up(key: string, time: number, held: Partial<KeyInput> = {}): KeyInput {
    return { ...down(key, time, held), phase: "up" }
}

function run(matcher: Matcher, inputs: readonly KeyInput[], until?: number) {
    let state: MatcherState = IDLE_STATE
    const events: Fired[] = []
    const prevented: boolean[] = []
    for (const input of inputs) {
        const result = handleKey(matcher, state, input)
        state = result.state
        events.push(...result.fired)
        prevented.push(result.prevent)
    }
    if (until !== undefined) {
        const result = advanceTime(matcher, state, until)
        state = result.state
        events.push(...result.fired)
    }
    const fired: BindingID[] = events.map((event) => event.binding)
    return { state, fired, events, prevented }
}

function matcherFor(bindings: readonly BindingInput[], platform: Platform = "other") {
    return createMatcher(bindings, { platform })
}

describe("presses", () => {
    it("fires a press once", () => {
        const matcher = matcherFor([binding("a", step("a"))])
        expect(run(matcher, [down("a", 0), up("a", 50)]).fired).toEqual(["a"])
    })

    it("ignores auto-repeat", () => {
        const matcher = matcherFor([binding("a", step("a"))])
        expect(run(matcher, [down("a", 0), down("a", 30, { repeat: true })]).fired).toEqual(["a"])
    })

    it("ignores keys during IME composition", () => {
        const matcher = matcherFor([binding("a", step("a"))])
        expect(run(matcher, [down("a", 0, { composing: true })]).fired).toEqual([])
    })

    it("ignores Caps Lock on letters", () => {
        const matcher = matcherFor([binding("a", step("a"))])
        expect(run(matcher, [down("A", 0)]).fired).toEqual(["a"])
    })

    it("asks for preventDefault only on a full match", () => {
        const matcher = matcherFor([binding("seq", step("g"), step("d"))])
        expect(run(matcher, [down("g", 0), down("d", 100)]).prevented).toEqual([false, true])
    })
})

describe("combos and modifiers", () => {
    it("rejects extra modifiers", () => {
        const matcher = matcherFor([binding("k", step("k"))])
        expect(run(matcher, [down("k", 0, { ctrl: true })]).fired).toEqual([])
        expect(run(matcher, [down("K", 0, { shift: true })]).fired).toEqual([])
    })

    it("resolves mod to Cmd on a Mac and Ctrl elsewhere", () => {
        const bindings = [binding("palette", step("k", "mod"))]
        expect(run(matcherFor(bindings, "mac"), [down("k", 0, { meta: true })]).fired).toEqual([
            "palette",
        ])
        expect(run(matcherFor(bindings, "mac"), [down("k", 0, { ctrl: true })]).fired).toEqual([])
        expect(run(matcherFor(bindings, "other"), [down("k", 0, { ctrl: true })]).fired).toEqual([
            "palette",
        ])
        expect(run(matcherFor(bindings, "other"), [down("k", 0, { meta: true })]).fired).toEqual([])
    })

    it("resolves alias names to the same key", () => {
        const matcher = matcherFor([
            binding("dot", step("dot")),
            binding("quote", step("singlequote")),
        ])
        expect(run(matcher, [down(".", 0)]).fired).toEqual(["dot"])
        expect(run(matcher, [down("'", 0)]).fired).toEqual(["quote"])
    })

    it("an alias and its canonical name share one trie node", () => {
        const matcher = matcherFor([binding("a", step("dot")), binding("b", step("period"))])
        expect(run(matcher, [down(".", 0)]).fired).toEqual(["a", "b"])
    })

    it("matches a question mark for shift and slash", () => {
        const matcher = matcherFor([
            binding("help", step("slash", "shift")),
            binding("search", step("slash")),
        ])
        expect(run(matcher, [down("?", 0, { shift: true })]).fired).toEqual(["help"])
        expect(run(matcher, [down("/", 0)]).fired).toEqual(["search"])
    })

    it("lets shift produce plus without counting as a modifier", () => {
        const matcher = matcherFor([binding("zoom", step("plus"))])
        expect(run(matcher, [down("+", 0, { shift: true })]).fired).toEqual(["zoom"])
    })

    it("tells left shift from right shift", () => {
        const matcher = matcherFor([binding("left", step("f", "lshift"))])
        const shift = { shift: true }
        const left = [down("Shift", 0, { ...shift, location: "left" }), down("F", 10, shift)]
        const right = [down("Shift", 0, { ...shift, location: "right" }), down("F", 10, shift)]
        expect(run(matcher, left).fired).toEqual(["left"])
        expect(run(matcher, right).fired).toEqual([])
    })

    it("pairs meta with left shift", () => {
        const matcher = matcherFor([binding("log", step("f", "meta", "lshift"))])
        const held = { shift: true, meta: true }
        const inputs = [down("Shift", 0, { shift: true, location: "left" }), down("F", 10, held)]
        expect(run(matcher, inputs).fired).toEqual(["log"])
    })
})

describe("sequences", () => {
    it("fires when the next step arrives within the timeout", () => {
        const matcher = matcherFor([binding("seq", step("a"), step("b"))])
        expect(run(matcher, [down("a", 0), down("b", 900)]).fired).toEqual(["seq"])
    })

    it("resets when the next step is too late", () => {
        const matcher = matcherFor([binding("seq", step("a"), step("b"))])
        const { fired, state } = run(matcher, [down("a", 0), down("b", 1200)])
        expect(fired).toEqual([])
        expect(state.active).toEqual([])
    })

    it("lets a step itself be a combo", () => {
        const matcher = matcherFor([binding("save", step("k", "mod"), step("s"))])
        expect(run(matcher, [down("k", 0, { ctrl: true }), down("s", 200)]).fired).toEqual(["save"])
    })

    it("does not break progress on a bare modifier key", () => {
        const matcher = matcherFor([binding("seq", step("g"), step("slash", "shift"))])
        const inputs = [
            down("g", 0),
            down("Shift", 100, { shift: true, location: "left" }),
            down("?", 150, { shift: true }),
        ]
        expect(run(matcher, inputs).fired).toEqual(["seq"])
    })

    it("restarts from a wrong key that is a valid first step", () => {
        const matcher = matcherFor([binding("gd", step("g"), step("d"))])
        expect(
            run(matcher, [down("g", 0), down("x", 100), down("g", 200), down("d", 300)]).fired,
        ).toEqual(["gd"])
        expect(run(matcher, [down("g", 0), down("g", 100), down("d", 200)]).fired).toEqual(["gd"])
    })

    it("does not advance a sequence on auto-repeat", () => {
        const matcher = matcherFor([binding("aa", step("a"), step("a"))])
        expect(run(matcher, [down("a", 0), down("a", 30, { repeat: true })]).fired).toEqual([])
    })

    it("shares one trie between bindings with a common prefix", () => {
        const matcher = matcherFor([
            binding("gd", step("g"), step("d")),
            binding("gi", step("g"), step("i")),
        ])
        expect(matcher.root.children).toHaveLength(1)
        expect(run(matcher, [down("g", 0), down("i", 100)]).fired).toEqual(["gi"])
    })
})

describe("overlap between a key and a longer sequence", () => {
    const bindings = [binding("a", step("a")), binding("ab", step("a"), step("b"))]

    it("fires the bare key only after the window passes", () => {
        const matcher = matcherFor(bindings)
        expect(run(matcher, [down("a", 0)], 999).fired).toEqual([])
        expect(run(matcher, [down("a", 0)], 1000).fired).toEqual(["a"])
    })

    it("fires only the sequence when it completes", () => {
        const matcher = matcherFor(bindings)
        expect(run(matcher, [down("a", 0), down("b", 300)], 5000).fired).toEqual(["ab"])
    })

    it("does not prevent the bare key while it waits", () => {
        const matcher = matcherFor(bindings)
        expect(run(matcher, [down("a", 0)]).prevented).toEqual([false])
    })

    it("fires the waiting key at once when another key breaks the sequence", () => {
        const matcher = matcherFor([...bindings, binding("x", step("x"))])
        expect(run(matcher, [down("a", 0), down("x", 100)]).fired).toEqual(["a", "x"])
    })

    it("reports the deadline a driver should schedule", () => {
        const matcher = matcherFor(bindings)
        const { state } = run(matcher, [down("a", 250)])
        expect(nextDeadline(matcher, state)).toBe(1250)
        expect(nextDeadline(matcher, IDLE_STATE)).toBeNull()
    })
})

describe("invalid input", () => {
    it("throws on an unknown key name from untyped code", () => {
        const untyped: BindingInput[] = JSON.parse(
            '[{"id":"x","steps":[{"key":"escpae","modifiers":[]}]}]',
        )
        expect(() => matcherFor(untyped)).toThrow('unknown key "escpae"')
    })
})

describe("waits", () => {
    const bindings = [binding("ab", step("a"), after(300, step("b")))]

    it("rejects a next step that arrives too early", () => {
        expect(run(matcherFor(bindings), [down("a", 0), down("b", 100)]).fired).toEqual([])
    })

    it("accepts a next step after the wait and within the timeout", () => {
        expect(run(matcherFor(bindings), [down("a", 0), down("b", 400)]).fired).toEqual(["ab"])
    })

    it("still enforces the sequence timeout", () => {
        expect(run(matcherFor(bindings), [down("a", 0), down("b", 1100)]).fired).toEqual([])
    })

    it("supports a wait followed by a hold", () => {
        const matcher = matcherFor([
            binding("archive", step("a"), after(300, step("b")), hold("c", 800)),
        ])
        const { events } = run(matcher, [
            down("a", 0),
            down("b", 400),
            down("c", 600),
            up("c", 1500),
        ])
        expect(events).toEqual([
            { type: "hold", binding: "archive", phase: "start", duration: 800 },
            { type: "hold", binding: "archive", phase: "release", duration: 900 },
        ])
    })

    it("refuses a wait at the start or one as long as the timeout", () => {
        expect(() => matcherFor([binding("x", after(100, step("a")))])).toThrow(
            "starts with a wait",
        )
        expect(() => matcherFor([binding("x", step("a"), after(1000, step("b")))])).toThrow(
            "shorter than",
        )
    })
})

describe("holds", () => {
    it("fires start at the threshold and release on keyup", () => {
        const matcher = matcherFor([binding("peek", hold("a")), binding("a", step("a"))])
        const { events } = run(matcher, [
            down("a", 0),
            down("a", 300, { repeat: true }),
            up("a", 700),
        ])
        expect(events).toEqual([
            { type: "hold", binding: "peek", phase: "start", duration: 500 },
            { type: "hold", binding: "peek", phase: "release", duration: 700 },
        ])
    })

    it("fires nothing when released before the threshold", () => {
        const matcher = matcherFor([binding("peek", hold("space", 300))])
        expect(run(matcher, [down(" ", 0), up(" ", 200)], 5000).events).toEqual([])
    })

    it("does not fire start at keydown", () => {
        const matcher = matcherFor([binding("peek", hold("a"))])
        const { state, events } = run(matcher, [down("a", 0)], 499)
        expect(events).toEqual([])
        expect(nextDeadline(matcher, state)).toBe(500)
    })

    it("separates a tap, a sequence and a hold on the same key", () => {
        const bindings = [
            binding("a", step("a")),
            binding("ab", step("a"), step("b")),
            binding("hold", hold("a")),
        ]
        const matcher = matcherFor(bindings)
        expect(run(matcher, [down("a", 0), up("a", 100)], 1100).fired).toEqual(["a"])
        expect(run(matcher, [down("a", 0), up("a", 100), down("b", 300)], 5000).fired).toEqual([
            "ab",
        ])
        expect(run(matcher, [down("a", 0), up("a", 900)], 5000).fired).toEqual(["hold", "hold"])
    })

    it("picks the tap or the hold after a shared prefix", () => {
        const matcher = matcherFor([
            binding("gd", step("g"), step("d")),
            binding("ghd", step("g"), hold("d")),
        ])
        expect(run(matcher, [down("g", 0), down("d", 100), up("d", 200)]).fired).toEqual(["gd"])
        const held = run(matcher, [down("g", 0), down("d", 100)], 600)
        expect(held.events).toEqual([
            { type: "hold", binding: "ghd", phase: "start", duration: 500 },
        ])
    })

    it("cancels an unstarted hold when another key is pressed", () => {
        const matcher = matcherFor([binding("peek", hold("a")), binding("x", step("x"))])
        expect(run(matcher, [down("a", 0), down("x", 100)], 5000).fired).toEqual(["x"])
    })

    it("ends a started hold on interrupt and leaves no state behind", () => {
        const matcher = matcherFor([binding("peek", hold("c"))])
        const { state } = run(matcher, [down("c", 0)], 600)
        const result = interrupt(state, 900)
        expect(result.fired).toEqual([
            { type: "hold", binding: "peek", phase: "release", duration: 900 },
        ])
        expect(result.state).toEqual(IDLE_STATE)
        expect(nextDeadline(matcher, result.state)).toBeNull()
    })

    it("ends a Cmd hold when Meta is released, since Mac sends no keyup for the key", () => {
        const matcher = matcherFor(
            [binding("big", { kind: "hold", key: "k", modifiers: ["mod"] })],
            "mac",
        )
        const inputs = [
            down("Meta", 0, { meta: true }),
            down("k", 10, { meta: true }),
            up("Meta", 800),
        ]
        expect(run(matcher, inputs).events).toEqual([
            { type: "hold", binding: "big", phase: "start", duration: 500 },
            { type: "hold", binding: "big", phase: "release", duration: 790 },
        ])
    })

    it("treats a quick Cmd release as a tap", () => {
        const bindings = [
            binding("tap", step("k", "mod")),
            binding("big", { kind: "hold", key: "k", modifiers: ["mod"] }),
        ]
        const inputs = [
            down("Meta", 0, { meta: true }),
            down("k", 10, { meta: true }),
            up("Meta", 100),
        ]
        expect(run(matcherFor(bindings, "mac"), inputs).fired).toEqual(["tap"])
    })
})

describe("hold rules", () => {
    it("prevents the keydown that begins a hold", () => {
        const matcher = matcherFor([binding("peek", hold("space", 100))])
        expect(run(matcher, [down(" ", 0)]).prevented).toEqual([true])
    })

    it("starts the sequence clock when the hold is released", () => {
        const matcher = matcherFor([binding("x", hold("c", 100), step("x"))])
        function phases(inputs: readonly KeyInput[]) {
            return run(matcher, inputs).events.map((event) =>
                event.type === "hold" ? event.phase : "press",
            )
        }
        expect(phases([down("c", 0), up("c", 5000), down("x", 5500)])).toEqual(["press"])
        expect(phases([down("c", 0), up("c", 5000), down("x", 6100)])).toEqual([])
        expect(phases([down("c", 0), down("x", 3000)])).toEqual(["press"])
    })
})

describe("alt on a Mac", () => {
    it("matches the physical key when Alt changes the character", () => {
        const matcher = matcherFor([binding("k", step("k", "alt"))], "mac")
        expect(run(matcher, [down("˚", 0, { alt: true, code: "KeyK" })]).fired).toEqual(["k"])
        expect(run(matcher, [down("˚", 0, { alt: true, code: "KeyJ" })]).fired).toEqual([])
    })
})

describe("error messages", () => {
    it("suggests the closest key name", () => {
        const typo: string = "escpae"
        const nonsense: string = "zzzzzz"
        expect(() => matcherFor([binding("x", untyped(typo))])).toThrow(
            'unknown key "escpae", did you mean "escape"?',
        )
        expect(() => matcherFor([binding("x", untyped(nonsense))])).toThrow("See KEY_NAMES")
    })
})
