import { afterEach, describe, expect, test } from "bun:test"
import { StrictMode, useState } from "react"
import { act, cleanup, render } from "@testing-library/react"
import { ShortcutProvider, useBinding, useShortcutList } from "../../src/react"
import type { Handle, Handler, Registry } from "../../src/registry/registry"
import { Bind, Capture, box, byId, press, recorder, silenceWarnings, tap } from "./helpers"

afterEach(() => {
    cleanup()
    document.body.innerHTML = ""
})

describe("useBinding", () => {
    test("runs the latest handler after a re-render without re-registering", () => {
        const first = recorder()
        const second = recorder()
        const handles: Handle[] = []
        const registry = box<Registry>()
        function App(props: { onFire: Handler }) {
            return (
                <ShortcutProvider platform="other">
                    <Capture onRegistry={(value) => (registry.current = value)} />
                    <Bind
                        steps={[press("k")]}
                        onFire={props.onFire}
                        onHandle={(handle) => handles.push(handle)}
                    />
                    <button id="inside" />
                </ShortcutProvider>
            )
        }
        const view = render(<App onFire={first.handler} />)
        const id = handles[0]?.id
        view.rerender(<App onFire={second.handler} />)
        act(() => {
            tap("k", byId("inside"))
        })
        expect(first.calls).toHaveLength(0)
        expect(second.calls).toHaveLength(1)
        expect(handles.at(-1)?.id).toBe(id)
        expect(registry.current?.list()).toHaveLength(1)
    })

    test("Strict Mode registers once without a duplicate warning", () => {
        const { warnings, restore } = silenceWarnings()
        const registry = box<Registry>()
        const { calls, handler } = recorder()
        render(
            <StrictMode>
                <ShortcutProvider platform="other">
                    <Capture onRegistry={(value) => (registry.current = value)} />
                    <Bind steps={[press("k")]} onFire={handler} />
                    <button id="inside" />
                </ShortcutProvider>
            </StrictMode>,
        )
        act(() => {
            tap("k", byId("inside"))
        })
        restore()
        expect(warnings).toEqual([])
        expect(registry.current?.list()).toHaveLength(1)
        expect(calls).toHaveLength(1)
    })

    test("unmounting the component unbinds", () => {
        const { calls, handler } = recorder()
        const registry = box<Registry>()
        function App(props: { bound: boolean }) {
            return (
                <ShortcutProvider platform="other">
                    <Capture onRegistry={(value) => (registry.current = value)} />
                    {props.bound && <Bind steps={[press("k")]} onFire={handler} />}
                    <button id="inside" />
                </ShortcutProvider>
            )
        }
        const view = render(<App bound />)
        expect(registry.current?.list()).toHaveLength(1)
        view.rerender(<App bound={false} />)
        expect(registry.current?.list()).toHaveLength(0)
        act(() => {
            tap("k", byId("inside"))
        })
        expect(calls).toHaveLength(0)
    })

    test("combo and display are ready on the first render and isEnabled follows the handle", () => {
        const seen: Array<[string, string, boolean]> = []
        const handle = box<Handle>()
        function Toggle(props: { onHandle: (handle: Handle) => void }) {
            const value = useBinding(
                { steps: [press("k", "mod")], description: "Palette" },
                () => {},
            )
            props.onHandle(value)
            seen.push([value.combo, value.display, value.isEnabled()])
            return null
        }
        render(
            <ShortcutProvider platform="other">
                <Toggle onHandle={(value) => (handle.current = value)} />
            </ShortcutProvider>,
        )
        expect(seen[0]).toEqual(["mod+k", "Ctrl+K", false])
        expect(seen.at(-1)).toEqual(["mod+k", "Ctrl+K", true])
        act(() => {
            handle.current?.disable()
        })
        expect(seen.at(-1)).toEqual(["mod+k", "Ctrl+K", false])
        expect(handle.current?.id).toBe("binding-1")
    })

    test("a new definition re-registers and the same one does not", () => {
        const handles: Handle[] = []
        function App() {
            const [key, setKey] = useState("k")
            return (
                <ShortcutProvider platform="other">
                    <Bind
                        steps={[press(key === "k" ? "k" : "j")]}
                        onFire={() => {}}
                        onHandle={(handle) => handles.push(handle)}
                    />
                    <button id="switch" onClick={() => setKey("j")} />
                </ShortcutProvider>
            )
        }
        render(<App />)
        const id = handles[0]?.id
        act(() => {
            byId("switch").click()
        })
        expect(handles.at(-1)?.combo).toBe("j")
        expect(handles.at(-1)?.id).not.toBe(id)
    })
})

describe("useShortcutList", () => {
    test("re-renders when a binding is disabled, which drops it from the list", () => {
        const handle = box<Handle>()
        function Help() {
            const bindings = useShortcutList()
            return <ul>{bindings.map((binding) => `${binding.combo}:${binding.enabled}`)}</ul>
        }
        const view = render(
            <ShortcutProvider platform="other">
                <Bind
                    steps={[press("k", "mod")]}
                    onFire={() => {}}
                    onHandle={(value) => (handle.current = value)}
                />
                <Bind steps={[press("j")]} onFire={() => {}} />
                <Help />
            </ShortcutProvider>,
        )
        expect(view.container.textContent).toBe("mod+k:truej:true")
        act(() => {
            handle.current?.disable()
        })
        expect(view.container.textContent).toBe("j:true")
        act(() => {
            handle.current?.enable()
        })
        expect(view.container.textContent).toBe("mod+k:truej:true")
    })
})
