import { afterEach, describe, expect, test } from "bun:test"
import { createMatcher } from "../../src/core/matcher"
import type { Fired } from "../../src/core/matcher"
import type { BindingInput } from "../../src/core/trie"
import type { KeyName, Milliseconds } from "../../src/shared/types/semantic"
import { createDriver } from "../../src/browser/driver"
import type { Driver, DriverOptions } from "../../src/browser/driver"

type Props = Partial<Omit<DriverOptions, "matcher" | "onFired">>

function press(key: KeyName): BindingInput["steps"][number] {
    return { kind: "press", key, modifiers: [] }
}

function hold(key: KeyName, threshold: Milliseconds): BindingInput["steps"][number] {
    return { kind: "hold", key, modifiers: [], threshold }
}

function sleep(ms: Milliseconds): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

const drivers: Driver[] = []

afterEach(() => {
    drivers.forEach((driver) => driver.destroy())
    drivers.length = 0
})

function setup(bindings: readonly BindingInput[], options: Props = {}) {
    const fired: string[] = []
    const events: Array<KeyboardEvent | null> = []
    const matcher = createMatcher(bindings, { platform: "other", sequenceTimeout: 60 })
    const driver = createDriver({
        ...options,
        matcher,
        onFired: (hits: readonly Fired[], event) => {
            hits.forEach((hit) => {
                fired.push(hit.type === "hold" ? `${hit.binding}:${hit.phase}` : hit.binding)
                events.push(event)
            })
            return true
        },
    })
    drivers.push(driver)
    return { driver, fired, events }
}

function key(type: "keydown" | "keyup", key: string, target: EventTarget = window) {
    const event = new KeyboardEvent(type, { key, cancelable: true, bubbles: true })
    target.dispatchEvent(event)
    return event
}

describe("createDriver", () => {
    test("a press fires with its event and prevents the default", () => {
        const { fired, events } = setup([{ id: "save", steps: [press("s")] }])
        const event = key("keydown", "s")
        expect(fired).toEqual(["save"])
        expect(events[0]).toBe(event)
        expect(event.defaultPrevented).toBe(true)
    })

    test("a partial sequence does not prevent, a full one does", () => {
        const { fired } = setup([{ id: "goto", steps: [press("g"), press("d")] }])
        const first = key("keydown", "g")
        expect(first.defaultPrevented).toBe(false)
        expect(fired).toEqual([])
        const second = key("keydown", "d")
        expect(second.defaultPrevented).toBe(true)
        expect(fired).toEqual(["goto"])
    })

    test("a sequence expires through the timer", async () => {
        const { fired } = setup([{ id: "goto", steps: [press("g"), press("d")] }])
        key("keydown", "g")
        await sleep(80)
        key("keydown", "d")
        expect(fired).toEqual([])
    })

    test("a hold starts from the timer and releases on keyup", async () => {
        const { fired, events } = setup([{ id: "peek", steps: [hold("space", 20)] }])
        key("keydown", " ")
        expect(fired).toEqual([])
        await sleep(40)
        expect(fired).toEqual(["peek:start"])
        expect(events[0]).toBeNull()
        key("keyup", " ")
        expect(fired).toEqual(["peek:start", "peek:release"])
    })

    test("window blur during a hold releases it", async () => {
        const { fired } = setup([{ id: "peek", steps: [hold("c", 20)] }])
        key("keydown", "c")
        await sleep(40)
        window.dispatchEvent(new Event("blur"))
        expect(fired).toEqual(["peek:start", "peek:release"])
        key("keyup", "c")
        expect(fired).toEqual(["peek:start", "peek:release"])
    })

    test("hiding the tab interrupts", async () => {
        const { fired } = setup([{ id: "peek", steps: [hold("c", 20)] }])
        key("keydown", "c")
        await sleep(40)
        Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true })
        document.dispatchEvent(new Event("visibilitychange"))
        Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true })
        expect(fired).toEqual(["peek:start", "peek:release"])
    })

    test("a keydown rejected by shouldHandle is dropped and resets progress", () => {
        const input = document.createElement("input")
        document.body.append(input)
        const { fired } = setup([{ id: "goto", steps: [press("g"), press("d")] }], {
            shouldHandle: (event) => event.target !== input,
        })
        key("keydown", "g")
        key("keydown", "x", input)
        key("keydown", "d")
        expect(fired).toEqual([])
        input.remove()
    })

    test("keyups are always fed so a hold can end inside an input", async () => {
        const input = document.createElement("input")
        document.body.append(input)
        const { fired } = setup([{ id: "peek", steps: [hold("c", 20)] }], {
            shouldHandle: (event) => event.target !== input,
        })
        key("keydown", "c")
        await sleep(40)
        key("keyup", "c", input)
        expect(fired).toEqual(["peek:start", "peek:release"])
        input.remove()
    })

    test("setMatcher swaps the bindings", () => {
        const { driver, fired } = setup([{ id: "old", steps: [press("a")] }])
        driver.setMatcher(
            createMatcher([{ id: "new", steps: [press("b")] }], { platform: "other" }),
        )
        key("keydown", "a")
        key("keydown", "b")
        expect(fired).toEqual(["new"])
    })

    test("a custom clock drives deadlines", async () => {
        let time = 0
        const { fired } = setup([{ id: "goto", steps: [press("g"), press("d")] }], {
            now: () => time,
        })
        key("keydown", "g")
        time = 30
        key("keydown", "d")
        expect(fired).toEqual(["goto"])
        key("keydown", "g")
        time = 100
        key("keydown", "d")
        expect(fired).toEqual(["goto"])
    })

    test("listens on an element instead of the window", () => {
        const region = document.createElement("div")
        document.body.append(region)
        const { fired } = setup([{ id: "save", steps: [press("s")] }], { target: region })
        key("keydown", "s")
        expect(fired).toEqual([])
        key("keydown", "s", region)
        expect(fired).toEqual(["save"])
        region.remove()
    })

    test("destroy stops everything and is safe to repeat", async () => {
        const { driver, fired } = setup([{ id: "peek", steps: [hold("c", 20)] }])
        key("keydown", "c")
        driver.destroy()
        driver.destroy()
        await sleep(40)
        key("keydown", "c")
        expect(fired).toEqual([])
    })
})
