import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { _createShortcutBuilder } from "../builder"
import { _resetSharedListeners } from "../runtime/listener"
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
        _resetSharedListeners()
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

    it("does not report a conflict between bindings whose scopes never overlap", () => {
        const onConflict = vi.fn()
        const { builder: $ } = createTestShortcut({ onConflict })

        $.key("/").on(() => {}, { scopes: "journal" })
        $.key("/").on(() => {}, { scopes: "notes" })

        expect(onConflict).not.toHaveBeenCalled()
    })

    it("still reports a conflict when two bindings share a scope", () => {
        const onConflict = vi.fn()
        const { builder: $ } = createTestShortcut({ onConflict })

        $.key("/").on(() => {}, { scopes: ["journal", "notes"] })
        $.key("/").on(() => {}, { scopes: "notes" })

        expect(onConflict).toHaveBeenCalledTimes(1)
    })

    it("still reports a conflict when one binding is unscoped and always live", () => {
        const onConflict = vi.fn()
        const { builder: $ } = createTestShortcut({ onConflict })

        $.key("/").on(() => {})
        $.key("/").on(() => {}, { scopes: "notes" })

        expect(onConflict).toHaveBeenCalledTimes(1)
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
