import { describe, it, expect, vi, beforeEach } from "vitest"
import { createShortcut, createShortcutMap, createShortcutGroup } from "../hook"

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

describe("advanced shortcut features", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
    })

    it("supports multi-key sequences with .then()", () => {
        const $ = createShortcut({ target: window, ignoreInputs: false })
        const handler = vi.fn()

        $.key("g").then("d").on(handler)

        dispatchKey("g")
        expect(handler).toHaveBeenCalledTimes(0)

        dispatchKey("d")
        expect(handler).toHaveBeenCalledTimes(1)
    })

    it("supports named scopes with runtime activation", () => {
        const $ = createShortcut({ target: window, ignoreInputs: false, activeScopes: "navigation" })
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
        const $ = createShortcut({ target: window, ignoreInputs: false, onConflict })

        $.key("g").on(() => {})
        $.key("g").then("d").on(() => {})

        expect(onConflict).toHaveBeenCalledTimes(1)
        expect(onConflict.mock.calls[0][0].reason).toBe("sequence-prefix")
    })

    it("registers shortcuts in bulk with createShortcutMap", () => {
        const save = vi.fn()
        const undo = vi.fn()

        createShortcutMap(
            {
                save: { keys: "mod+s", handler: save },
                undo: { keys: "mod+z", handler: undo },
            },
            { target: window, ignoreInputs: false },
        )

        dispatchKey("s", { ctrlKey: true })
        dispatchKey("z", { ctrlKey: true })

        expect(save).toHaveBeenCalledTimes(1)
        expect(undo).toHaveBeenCalledTimes(1)
    })

    it("records the next key combo", async () => {
        const $ = createShortcut({ target: window })

        const recordPromise = $.record({ timeoutMs: 1000 })
        dispatchKey("k", { ctrlKey: true })

        await expect(recordPromise).resolves.toBe("ctrl+k")
    })

    it("respects priority and stopOnMatch for overlapping combos", () => {
        const $ = createShortcut({ target: window, ignoreInputs: false })
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
        const $ = createShortcut({
            target: window,
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
        const $ = createShortcut({ target: window, ignoreInputs: false })
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
})
