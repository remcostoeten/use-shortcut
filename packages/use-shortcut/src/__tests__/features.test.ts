import { describe, it, expect, vi, beforeEach } from "vitest"
import { _createShortcutBuilder } from "../builder"
import { registerShortcutMap, createShortcutGroup } from "../hook"
import { _attachRegistryListener } from "../runtime/listener"
import type { ShortcutAttemptDebugEvent, ShortcutBuilder, UseShortcutOptions } from "../types"

function dispatchKey(key: string, options: KeyboardEventInit = {}) {
    window.dispatchEvent(
        new KeyboardEvent("keydown", {
            key,
            bubbles: true,
            cancelable: true,
            ...options,
        }),
    )
}

function createTestShortcut(options: UseShortcutOptions = {}): ShortcutBuilder {
    const { builder } = _createShortcutBuilder({
        target: window,
        ...options,
    })

    return builder as ShortcutBuilder
}

describe("advanced shortcut features", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
    })

    it("supports multi-key sequences with .then()", () => {
        const $ = createTestShortcut({ ignoreInputs: false })
        const handler = vi.fn()

        $.key("g").then("d").on(handler)

        dispatchKey("g")
        expect(handler).toHaveBeenCalledTimes(0)

        dispatchKey("d")
        expect(handler).toHaveBeenCalledTimes(1)
    })

    it("supports named scopes with runtime activation", () => {
        const $ = createTestShortcut({ ignoreInputs: false, activeScopes: "navigation" })
        const handler = vi.fn()

        $.in("editor").mod.key("s").on(handler)

        dispatchKey("s", { ctrlKey: true })
        expect(handler).toHaveBeenCalledTimes(0)

        $.setScopes("editor")
        dispatchKey("s", { ctrlKey: true })
        expect(handler).toHaveBeenCalledTimes(1)
    })

    it("reports sequence overlap conflicts", () => {
        const onConflict = vi.fn()
        const $ = createTestShortcut({ ignoreInputs: false, onConflict })

        $.key("g").on(() => {})
        $.key("g").then("d").on(() => {})

        expect(onConflict).toHaveBeenCalledTimes(1)
        expect(onConflict.mock.calls[0][0].reason).toBe("sequence-prefix")
    })

    it("registers shortcuts in bulk with registerShortcutMap", () => {
        const save = vi.fn()
        const undo = vi.fn()
        const $ = createTestShortcut({ ignoreInputs: false })

        registerShortcutMap(
            $,
            {
                save: { keys: "mod+s", handler: save },
                undo: { keys: "mod+z", handler: undo },
            },
        )

        dispatchKey("s", { ctrlKey: true })
        dispatchKey("z", { ctrlKey: true })

        expect(save).toHaveBeenCalledTimes(1)
        expect(undo).toHaveBeenCalledTimes(1)
    })

    it("registers literal symbol shortcuts in bulk", () => {
        const zoomIn = vi.fn()
        const zoomOut = vi.fn()
        const $ = createTestShortcut({ ignoreInputs: false })

        registerShortcutMap(
            $,
            {
                zoomIn: { keys: "ctrl++", handler: zoomIn },
                zoomOut: { keys: "ctrl+-", handler: zoomOut },
            },
        )

        dispatchKey("+", { ctrlKey: true })
        dispatchKey("-", { ctrlKey: true })

        expect(zoomIn).toHaveBeenCalledTimes(1)
        expect(zoomOut).toHaveBeenCalledTimes(1)
    })

    it("records the next key combo", async () => {
        const $ = createTestShortcut()

        const recordPromise = $.record({ timeoutMs: 1000 })
        dispatchKey("k", { ctrlKey: true })

        await expect(recordPromise).resolves.toBe("ctrl+k")
    })

    it("records space key combos as parseable tokens", async () => {
        const $ = createTestShortcut()

        const recordPromise = $.record({ timeoutMs: 1000 })
        dispatchKey(" ", { ctrlKey: true })

        await expect(recordPromise).resolves.toBe("ctrl+space")
    })

    it("matches ctrl+space shortcuts", () => {
        const $ = createTestShortcut({ ignoreInputs: false })
        const handler = vi.fn()

        $.mod.key("space").on(handler)

        dispatchKey(" ", { ctrlKey: true })

        expect(handler).toHaveBeenCalledTimes(1)
    })

    it("bind: works with single combo string", () => {
        const $ = createTestShortcut({ ignoreInputs: false })
        const handler = vi.fn()

        $.bind("mod+k").on(handler)

        dispatchKey("k", { ctrlKey: true })

        expect(handler).toHaveBeenCalledTimes(1)
    })

    it("bind: works with array of combos", () => {
        const $ = createTestShortcut({ ignoreInputs: false })
        const handler = vi.fn()

        $.bind(["mod+k", "mod+p"]).on(handler)

        dispatchKey("k", { ctrlKey: true })
        dispatchKey("p", { ctrlKey: true })

        expect(handler).toHaveBeenCalledTimes(2)
    })

    it("respects priority and stopOnMatch for overlapping combos", () => {
        const $ = createTestShortcut({ ignoreInputs: false, conflictWarnings: false })
        const primary = vi.fn()
        const secondary = vi.fn()

        $.mod.key("k").on(primary, { priority: 10, stopOnMatch: true })
        $.mod.key("k").on(secondary, { priority: 0 })

        dispatchKey("k", { ctrlKey: true })

        expect(primary).toHaveBeenCalledTimes(1)
        expect(secondary).toHaveBeenCalledTimes(0)
    })

    it("applies global eventFilter before handlers", () => {
        const handler = vi.fn()
        const $ = createTestShortcut({
            ignoreInputs: false,
            eventFilter: (event) => event.key !== "x",
        })

        $.key("x").on(handler)
        $.key("y").on(handler)

        dispatchKey("x")
        dispatchKey("y")

        expect(handler).toHaveBeenCalledTimes(1)
    })

    it("supports shortcut groups for cleanup", () => {
        const $ = createTestShortcut({ ignoreInputs: false })
        const group = createShortcutGroup()
        const handler = vi.fn()

        const result = $.mod.key("s").on(handler)
        group.add(result)

        dispatchKey("s", { ctrlKey: true })
        expect(handler).toHaveBeenCalledTimes(1)

        group.unbindAll()

        dispatchKey("s", { ctrlKey: true })
        expect(handler).toHaveBeenCalledTimes(1)
    })

    it("emits per-shortcut debug attempt details with token verdicts", () => {
        const $ = createTestShortcut({ ignoreInputs: false })
        const handler = vi.fn()
        const attempts: ShortcutAttemptDebugEvent[] = []

        const result = $.shift.key("e").then("e").on(handler)
        result.onAttempt?.((_, __, details) => {
            if (details) {
                attempts.push(details as never)
            }
        })

        dispatchKey("e", { ctrlKey: true })
        dispatchKey("e")

        expect(attempts).toHaveLength(2)
        expect(attempts[0].status).toBe("mismatch")
        expect(attempts[0].steps[0].tokens).toEqual([
            { token: "ctrl", kind: "modifier", status: "mismatch" },
            { token: "e", kind: "key", status: "match" },
        ])
        expect(attempts[1].steps[1].status).toBe("partial")
    })

    it("emits global debug events for every keypress", () => {
        const $ = createTestShortcut({ ignoreInputs: false })
        const handler = vi.fn()
        const debugListener = vi.fn()

        $.mod.key("k").on(handler)
        const unsubscribe = $.onDebug(debugListener)

        dispatchKey("x")
        dispatchKey("k", { ctrlKey: true })

        expect(debugListener).toHaveBeenCalledTimes(2)
        expect(debugListener.mock.calls[0][0].input.combo).toBe("x")
        expect(debugListener.mock.calls[0][0].attempts[0].status).toBe("mismatch")
        expect(debugListener.mock.calls[1][0].attempts[0].status).toBe("matched")

        unsubscribe()
    })

    it("reports exact conflicts for duplicate combos", () => {
        const onConflict = vi.fn()
        const $ = createTestShortcut({ ignoreInputs: false, onConflict })

        $.mod.key("k").on(() => {})
        $.mod.key("k").on(() => {})

        expect(onConflict).toHaveBeenCalledTimes(1)
        expect(onConflict.mock.calls[0][0]).toMatchObject({
            combo: "ctrl+k",
            existingCombo: "ctrl+k",
            reason: "exact",
        })
    })

    it("does not run delayed handlers after unbind", () => {
        vi.useFakeTimers()
        const $ = createTestShortcut({ ignoreInputs: false })
        const handler = vi.fn()

        const result = $.key("x").on(handler, { delay: 50 })
        dispatchKey("x")
        result.unbind()
        vi.advanceTimersByTime(50)

        expect(handler).toHaveBeenCalledTimes(0)
        vi.useRealTimers()
    })

    it("does not run delayed handlers after disable", () => {
        vi.useFakeTimers()
        const $ = createTestShortcut({ ignoreInputs: false })
        const handler = vi.fn()

        const result = $.key("x").on(handler, { delay: 50 })
        dispatchKey("x")
        result.disable()
        vi.advanceTimersByTime(50)

        expect(handler).toHaveBeenCalledTimes(0)
        vi.useRealTimers()
    })

    it("reattaches when target or event type changes", () => {
        const firstTarget = document.createElement("div")
        const secondTarget = document.createElement("div")
        const handler = vi.fn()
        const { builder, registry } = _createShortcutBuilder({
            target: firstTarget,
            ignoreInputs: false,
        })

        builder.key("x").on(handler)
        firstTarget.dispatchEvent(new KeyboardEvent("keydown", { key: "x", bubbles: true }))
        expect(handler).toHaveBeenCalledTimes(1)

        registry.options = {
            ...registry.options,
            target: secondTarget,
            eventType: "keyup",
        }
        _attachRegistryListener(registry)

        firstTarget.dispatchEvent(new KeyboardEvent("keydown", { key: "x", bubbles: true }))
        secondTarget.dispatchEvent(new KeyboardEvent("keydown", { key: "x", bubbles: true }))
        secondTarget.dispatchEvent(new KeyboardEvent("keyup", { key: "x", bubbles: true }))

        expect(handler).toHaveBeenCalledTimes(2)
    })

    it("reconciles render-style registrations by slot instead of stacking duplicates", () => {
        const firstHandler = vi.fn()
        const secondHandler = vi.fn()
        const { builder, registry } = _createShortcutBuilder({
            target: window,
            ignoreInputs: false,
        })

        registry.reconcileRenderBindings = true
        registry.collectingRenderBindings = true
        registry.renderCycle = 1
        registry.nextRenderSlot = 0
        builder.key("x").on(firstHandler)

        registry.renderCycle = 2
        registry.nextRenderSlot = 0
        builder.key("x").on(secondHandler)
        registry.collectingRenderBindings = false
        _attachRegistryListener(registry)

        dispatchKey("x")

        expect(firstHandler).toHaveBeenCalledTimes(0)
        expect(secondHandler).toHaveBeenCalledTimes(1)
    })

    it("attaches effect-time registrations immediately in reconcile mode", () => {
        const handler = vi.fn()
        const { builder, registry } = _createShortcutBuilder({
            target: window,
            ignoreInputs: false,
        })

        registry.reconcileRenderBindings = true
        registry.collectingRenderBindings = false
        registry.renderCycle = 1
        registry.nextRenderSlot = 0

        builder.key("x").on(handler)
        dispatchKey("x")

        expect(handler).toHaveBeenCalledTimes(1)
    })

    it("does not prune effect-time registrations during render-slot reconciliation", () => {
        const handler = vi.fn()
        const { builder, registry } = _createShortcutBuilder({
            target: window,
            ignoreInputs: false,
        })

        registry.reconcileRenderBindings = true
        registry.collectingRenderBindings = false
        registry.renderCycle = 1
        builder.key("x").on(handler)

        registry.collectingRenderBindings = true
        registry.renderCycle = 2
        registry.nextRenderSlot = 0
        expect(registry.renderSlots.size).toBe(0)
        registry.collectingRenderBindings = false
        _attachRegistryListener(registry)

        dispatchKey("x")

        expect(handler).toHaveBeenCalledTimes(1)
    })
})
