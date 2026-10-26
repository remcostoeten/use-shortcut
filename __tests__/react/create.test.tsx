import { afterEach, describe, expect, test } from "bun:test"
import { act, cleanup, render } from "@testing-library/react"
import { useState } from "react"
import { createShortcuts } from "../../src/react/create"

const { shortcut, ShortcutProvider } = createShortcuts({ scopes: ["app"] })

afterEach(cleanup)

function keydown(target: Element, key: string, init: KeyboardEventInit = {}) {
    target.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }),
    )
}

describe("createShortcuts (react)", () => {
    test("a chain binding is a hook that fires and shows its display", () => {
        function Palette() {
            const [count, setCount] = useState(0)
            const handle = shortcut.mod
                .key("k")
                .in("app")
                .on(() => setCount((current) => current + 1))
            return <kbd data-count={count}>{handle.display}</kbd>
        }
        const { container } = render(
            <ShortcutProvider scopes={["app"]} platform="mac">
                <Palette />
            </ShortcutProvider>,
        )
        const kbd = container.querySelector("kbd")
        expect(kbd?.textContent).toBe("⌘K")
        act(() => {
            if (kbd) keydown(kbd, "k", { metaKey: true })
        })
        expect(container.querySelector("kbd")?.dataset["count"]).toBe("1")
    })
})
