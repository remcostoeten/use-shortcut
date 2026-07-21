import { beforeEach, describe, expect, it, vi } from "vitest"
import { _createShortcutBuilder } from "../builder"
import { matchesShortcut, parseShortcut } from "../parser"
import type { ShortcutBuilder, UseShortcutOptions } from "../types"

function createTestShortcut(options: UseShortcutOptions = {}) {
    return _createShortcutBuilder({
        ignoreInputs: false,
        ...options,
    }) as ReturnType<typeof _createShortcutBuilder> & { builder: ShortcutBuilder }
}

function dispatchKey(
    target: EventTarget,
    key: string,
    options: KeyboardEventInit = {},
) {
    target.dispatchEvent(
        new KeyboardEvent("keydown", {
            key,
            bubbles: true,
            cancelable: true,
            ...options,
        }),
    )
}

describe("hot-path dispatch regressions", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
    })

    it("still matches after unrelated keys pass through the fast-path exit", () => {
        const target = document.createElement("div")
        const handler = vi.fn()
        const { builder: $ } = createTestShortcut({ target })

        $.mod.key("s").on(handler)

        dispatchKey(target, "a")
        dispatchKey(target, "b")
        dispatchKey(target, "s", { ctrlKey: true })

        expect(handler).toHaveBeenCalledTimes(1)
    })

    it("keeps multi-step sequences working across the fast-path exit", () => {
        const target = document.createElement("div")
        const handler = vi.fn()
        const { builder: $ } = createTestShortcut({ target })

        $.key("g").then("d").on(handler)

        dispatchKey(target, "g")
        dispatchKey(target, "d")

        expect(handler).toHaveBeenCalledTimes(1)
    })

    it("resets sequence progress on a non-matching key despite the fast path", () => {
        const target = document.createElement("div")
        const handler = vi.fn()
        const { builder: $ } = createTestShortcut({ target })

        $.key("g").then("d").on(handler)

        dispatchKey(target, "g")
        dispatchKey(target, "x")
        dispatchKey(target, "d")

        expect(handler).not.toHaveBeenCalled()
    })

    it("delivers debug events for keys that match no shortcut", () => {
        const target = document.createElement("div")
        const debugEvents: string[] = []
        const { builder: $ } = createTestShortcut({ target })

        $.key("k").on(vi.fn())
        $.onDebug((event) => debugEvents.push(event.input.combo))

        dispatchKey(target, "z")

        expect(debugEvents).toEqual(["z"])
    })

    it("maintains the registry attempt-callback count across add, remove, and unbind", () => {
        const target = document.createElement("div")
        const { builder: $, registry } = createTestShortcut({ target })

        const first = $.key("a").on(vi.fn())
        const second = $.key("b").on(vi.fn())

        const removeFirst = first.onAttempt?.(vi.fn())
        second.onAttempt?.(vi.fn())
        expect(registry.attemptCallbackCount).toBe(2)

        removeFirst?.()
        expect(registry.attemptCallbackCount).toBe(1)

        second.unbind()
        expect(registry.attemptCallbackCount).toBe(0)
    })

    it("fires attempt callbacks with details when only one entry subscribes", () => {
        const target = document.createElement("div")
        const attempt = vi.fn()
        const { builder: $ } = createTestShortcut({ target })

        const result = $.key("k").on(vi.fn())
        result.onAttempt?.(attempt)

        dispatchKey(target, "k")

        expect(attempt).toHaveBeenCalledTimes(1)
        expect(attempt.mock.calls[0][0]).toBe(true)
        expect(attempt.mock.calls[0][2]?.combo).toBe("k")
    })

    it("respects priority order regardless of registration order", () => {
        const target = document.createElement("div")
        const calls: string[] = []
        const { builder: $ } = createTestShortcut({ target })

        $.key("p").on(() => calls.push("low"), { priority: 0 })
        $.key("p").on(() => calls.push("high"), { priority: 10, stopOnMatch: true })

        dispatchKey(target, "p")

        expect(calls).toEqual(["high"])
    })

    it("does not fire a same-combo shortcut registered by a handler for the same event", () => {
        const target = document.createElement("div")
        const late = vi.fn()
        const { builder: $ } = createTestShortcut({ target })

        $.key("r").on(() => {
            $.key("r").on(late)
        })

        dispatchKey(target, "r")
        expect(late).not.toHaveBeenCalled()

        dispatchKey(target, "r")
        expect(late).toHaveBeenCalledTimes(1)
    })

    it("precomputes matchKey at parse time and matches through it", () => {
        expect(parseShortcut("shift+A").matchKey).toBe("a")
        expect(parseShortcut("mod+space").matchKey).toBe("space")
    })

    it("still matches ParsedShortcut values constructed without matchKey", () => {
        const event = new KeyboardEvent("keydown", { key: "S", shiftKey: true })
        const legacyParsed = {
            modifiers: { meta: false, ctrl: false, alt: false, shift: true },
            key: "S",
            original: "shift+s",
        }

        expect(matchesShortcut(event, legacyParsed)).toBe(true)
    })
})
