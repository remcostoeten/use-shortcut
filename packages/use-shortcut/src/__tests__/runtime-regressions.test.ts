import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { _createShortcutBuilder } from "../builder"
import type { ShortcutBuilder, UseShortcutOptions } from "../types"

function createTestShortcut(options: UseShortcutOptions = {}) {
    return _createShortcutBuilder({
        ignoreInputs: false,
        ...options,
    }) as ReturnType<typeof _createShortcutBuilder> & { builder: ShortcutBuilder }
}

function dispatchKey(
    target: EventTarget,
    type: "keydown" | "keyup",
    key: string,
    options: KeyboardEventInit = {},
) {
    target.dispatchEvent(
        new KeyboardEvent(type, {
            key,
            bubbles: true,
            cancelable: true,
            ...options,
        }),
    )
}

describe("runtime lifecycle regressions", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("detaches the original listener when useShortcut target and eventType options change", () => {
        const firstTarget = document.createElement("div")
        const secondTarget = document.createElement("div")
        const handler = vi.fn()
        const { builder: $, registry } = createTestShortcut({
            target: firstTarget,
            eventType: "keydown",
        })

        $.key("k").on(handler)
        dispatchKey(firstTarget, "keydown", "k")
        expect(handler).toHaveBeenCalledTimes(1)

        registry.options = {
            ...registry.options,
            target: secondTarget,
            eventType: "keyup",
        }

        dispatchKey(firstTarget, "keydown", "k")

        expect(handler).toHaveBeenCalledTimes(1)
    })

    it("attaches the new listener when useShortcut target and eventType options change", () => {
        const firstTarget = document.createElement("div")
        const secondTarget = document.createElement("div")
        const handler = vi.fn()
        const { builder: $, registry } = createTestShortcut({
            target: firstTarget,
            eventType: "keydown",
        })

        $.key("k").on(handler)
        dispatchKey(firstTarget, "keydown", "k")
        expect(handler).toHaveBeenCalledTimes(1)

        registry.options = {
            ...registry.options,
            target: secondTarget,
            eventType: "keyup",
        }

        dispatchKey(secondTarget, "keyup", "k")

        expect(handler).toHaveBeenCalledTimes(2)
    })

    it("reports exact duplicate shortcuts through onConflict with both combos", () => {
        const onConflict = vi.fn()
        const { builder: $ } = createTestShortcut({ onConflict })

        $.ctrl.key("k").on(() => {})
        $.ctrl.key("k").on(() => {})

        expect(onConflict).toHaveBeenCalledTimes(1)
        expect(onConflict).toHaveBeenCalledWith({
            combo: "ctrl+k",
            existingCombo: "ctrl+k",
            reason: "exact",
        })
    })

    it("does not run a delayed handler after its binding is unbound", () => {
        vi.useFakeTimers()
        const target = document.createElement("div")
        const handler = vi.fn()
        const { builder: $ } = createTestShortcut({ target })

        const result = $.key("d").on(handler, { delay: 25 })
        dispatchKey(target, "keydown", "d")
        result.unbind()

        vi.advanceTimersByTime(25)

        expect(handler).not.toHaveBeenCalled()
    })

    it("does not run a delayed handler after its binding is disabled", () => {
        vi.useFakeTimers()
        const target = document.createElement("div")
        const handler = vi.fn()
        const { builder: $ } = createTestShortcut({ target })

        const result = $.key("d").on(handler, { delay: 25 })
        dispatchKey(target, "keydown", "d")
        result.disable()

        vi.advanceTimersByTime(25)

        expect(handler).not.toHaveBeenCalled()
    })
})
