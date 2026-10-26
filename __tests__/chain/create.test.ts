import { afterEach, describe, expect, test } from "bun:test"
import { createShortcuts } from "../../src/chain/create"

const created: Array<{ destroy: () => void }> = []

afterEach(() => {
    created.forEach((registry) => registry.destroy())
    created.length = 0
})

describe("createShortcuts (plain)", () => {
    test("binds through the registry and fires on the window", () => {
        const { shortcut, registry } = createShortcuts({
            scopes: ["app"],
            platform: "other",
            host: "web",
        })
        created.push(registry)
        const combos: string[] = []
        const handle = shortcut.mod
            .key("k")
            .in("app")
            .on((event) => combos.push(event.combo))
        window.dispatchEvent(
            new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }),
        )
        expect(combos).toEqual(["mod+k"])
        expect(handle.display).toBe("Ctrl+K")
        handle.unbind()
        window.dispatchEvent(
            new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }),
        )
        expect(combos).toHaveLength(1)
    })
})
