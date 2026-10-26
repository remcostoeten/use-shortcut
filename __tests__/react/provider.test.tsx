import { afterEach, describe, expect, test } from "bun:test"
import { createPortal } from "react-dom"
import { renderToString } from "react-dom/server"
import { act, cleanup, render } from "@testing-library/react"
import { ShortcutBoundary, ShortcutProvider, useRegistry, useShortcutList } from "../../src/react"
import { Bind, Capture, box, byId, key, press, recorder, silenceWarnings, tap } from "./helpers"

afterEach(() => {
    cleanup()
    document.body.innerHTML = ""
})

function Outside() {
    useRegistry()
    return null
}

describe("ShortcutProvider", () => {
    test("a binding fires for keys inside the provider and not outside it", () => {
        const { calls, handler } = recorder()
        const outside = document.createElement("button")
        outside.id = "outside"
        document.body.append(outside)
        render(
            <ShortcutProvider platform="other">
                <Bind steps={[press("k", "mod")]} onFire={handler} />
                <button id="inside" />
            </ShortcutProvider>,
        )
        act(() => {
            tap("k", outside, { ctrlKey: true })
        })
        expect(calls).toHaveLength(0)
        const event = box<KeyboardEvent>()
        act(() => {
            event.current = key("keydown", "k", byId("inside"), { ctrlKey: true })
        })
        expect(calls).toHaveLength(1)
        expect(calls[0]).toMatchObject({ combo: "mod+k" })
        expect(event.current?.defaultPrevented).toBe(true)
    })

    test("the outermost provider receives keys when nothing has focus", () => {
        const { calls, handler } = recorder()
        render(
            <ShortcutProvider platform="other">
                <Bind steps={[press("k")]} onFire={handler} />
                <ShortcutProvider platform="other">
                    <Bind steps={[press("j")]} onFire={handler} />
                </ShortcutProvider>
            </ShortcutProvider>,
        )
        act(() => {
            tap("k", document.body)
            tap("j", document.body)
        })
        expect(calls.map((call) => call.combo)).toEqual(["k"])
    })

    test("keys in a portal rendered inside the provider reach it, with the real target", () => {
        const { calls, handler } = recorder()
        function Portal() {
            return createPortal(
                <div>
                    <button id="portal" />
                    <input id="portal-input" />
                </div>,
                document.body,
            )
        }
        render(
            <ShortcutProvider platform="other">
                <Bind steps={[press("k")]} onFire={handler} />
                <Portal />
            </ShortcutProvider>,
        )
        act(() => {
            tap("k", byId("portal"))
        })
        expect(calls).toHaveLength(1)
        act(() => {
            tap("k", byId("portal-input"))
        })
        expect(calls).toHaveLength(1)
    })

    test("a nested provider is isolated and inherit lets listed combos through", () => {
        const outer = recorder()
        const inner = recorder()
        render(
            <ShortcutProvider platform="other">
                <Bind steps={[press("a")]} onFire={outer.handler} />
                <Bind steps={[press("b")]} onFire={outer.handler} />
                <button id="outer" />
                <ShortcutProvider platform="other" inherit={["a"]}>
                    <Bind steps={[press("c")]} onFire={inner.handler} />
                    <button id="inner" />
                </ShortcutProvider>
            </ShortcutProvider>,
        )
        act(() => {
            tap("b", byId("inner"))
            tap("c", byId("outer"))
        })
        expect(outer.calls).toHaveLength(0)
        expect(inner.calls).toHaveLength(0)
        act(() => {
            tap("a", byId("inner"))
            tap("c", byId("inner"))
            tap("b", byId("outer"))
        })
        expect(outer.calls.map((call) => call.combo)).toEqual(["a", "b"])
        expect(inner.calls.map((call) => call.combo)).toEqual(["c"])
    })

    test("warns when an inherit entry matches no outer binding", async () => {
        const { warnings, restore } = silenceWarnings()
        render(
            <ShortcutProvider platform="other">
                <Bind steps={[press("a")]} onFire={() => {}} />
                <ShortcutProvider platform="other" inherit={["a", "mod+z"]}>
                    <span />
                </ShortcutProvider>
            </ShortcutProvider>,
        )
        await act(async () => {})
        restore()
        expect(warnings).toHaveLength(1)
        expect(warnings[0]).toContain('"mod+z"')
    })

    test("a key handled by an inner provider resets the outer one's progress", () => {
        const { calls, handler } = recorder()
        render(
            <ShortcutProvider platform="other">
                <Bind steps={[press("g"), press("i")]} onFire={handler} />
                <button id="outer" />
                <ShortcutProvider platform="other">
                    <button id="inner" />
                </ShortcutProvider>
            </ShortcutProvider>,
        )
        act(() => {
            tap("g", byId("outer"))
            tap("x", byId("inner"))
            tap("i", byId("outer"))
        })
        expect(calls).toHaveLength(0)
        act(() => {
            tap("g", byId("outer"))
            tap("i", byId("outer"))
        })
        expect(calls).toHaveLength(1)
    })

    test("a disabled boundary keeps keys from the provider and a live one is transparent", () => {
        const { calls, handler } = recorder()
        function App(props: { disabled: boolean }) {
            return (
                <ShortcutProvider platform="other">
                    <Bind steps={[press("k")]} onFire={handler} />
                    <ShortcutBoundary disabled={props.disabled}>
                        <button id="boxed" />
                    </ShortcutBoundary>
                </ShortcutProvider>
            )
        }
        const view = render(<App disabled />)
        act(() => {
            tap("k", byId("boxed"))
        })
        expect(calls).toHaveLength(0)
        view.rerender(<App disabled={false} />)
        act(() => {
            tap("k", byId("boxed"))
        })
        expect(calls).toHaveLength(1)
    })

    test("useRegistry throws outside a provider", () => {
        const previous = console.error
        console.error = () => {}
        expect(() => render(<Outside />)).toThrow("outside a <ShortcutProvider>")
        console.error = previous
    })

    test("renders on the server without touching the DOM", () => {
        function Help() {
            const bindings = useShortcutList()
            return <span>{bindings.length}</span>
        }
        const html = renderToString(
            <ShortcutProvider platform="other" scopes={["app"]}>
                <Bind steps={[press("k", "mod")]} onFire={() => {}} />
                <Capture onRegistry={(registry) => registry.list()} />
                <Help />
                <p>hello</p>
            </ShortcutProvider>,
        )
        expect(html).toContain("hello")
        expect(html).toContain("<span>0</span>")
    })
})
