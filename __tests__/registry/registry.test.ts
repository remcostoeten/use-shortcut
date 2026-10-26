import { afterEach, describe, expect, mock, test } from "bun:test"
import type { StepInput } from "../../src/core/step"
import { createRegistry } from "../../src/registry/registry"
import type { Registry, RegistryOptions, ShortcutEvent } from "../../src/registry/registry"
import type { KeyName, Modifier } from "../../src/shared/types/semantic"

type Props = Partial<RegistryOptions>

const registries: Registry[] = []

afterEach(() => {
    registries.forEach((registry) => registry.destroy())
    registries.length = 0
    document.body.innerHTML = ""
})

function press(key: KeyName, ...modifiers: Modifier[]): StepInput {
    return { kind: "press", key, modifiers }
}

function setup(options: Props = {}) {
    const registry = createRegistry({ platform: "other", host: "web", ...options })
    registries.push(registry)
    return registry
}

function key(
    type: "keydown" | "keyup",
    key: string,
    init: KeyboardEventInit = {},
    target: EventTarget = window,
) {
    const event = new KeyboardEvent(type, { key, cancelable: true, bubbles: true, ...init })
    target.dispatchEvent(event)
    return event
}

function recorder() {
    const calls: ShortcutEvent[] = []
    return { calls, handler: (event: ShortcutEvent) => calls.push(event) }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

describe("createRegistry", () => {
    test("a binding fires with its combo and the event", () => {
        const registry = setup()
        const { calls, handler } = recorder()
        const handle = registry.add({ steps: [press("k", "mod")] }, handler)
        const event = key("keydown", "k", { ctrlKey: true })
        expect(calls).toEqual([{ combo: "mod+k", event }])
        expect(event.defaultPrevented).toBe(true)
        expect(handle.combo).toBe("mod+k")
        expect(handle.display).toBe("Ctrl+K")
    })

    test("handles enable, disable, unbind and trigger", () => {
        const registry = setup()
        const { calls, handler } = recorder()
        const handle = registry.add({ steps: [press("s")] }, handler)
        handle.disable()
        expect(handle.isEnabled()).toBe(false)
        key("keydown", "s")
        handle.trigger()
        expect(calls).toHaveLength(0)
        handle.enable()
        handle.trigger()
        expect(calls).toEqual([{ combo: "s", event: null }])
        handle.unbind()
        key("keydown", "s")
        expect(calls).toHaveLength(1)
    })

    test("scopes switch bindings on and off", () => {
        const registry = setup({ scopes: ["app"] })
        const { calls, handler } = recorder()
        registry.add({ steps: [press("s")], scopes: ["editor"] }, handler)
        key("keydown", "s")
        expect(calls).toHaveLength(0)
        registry.enable("editor")
        key("keydown", "s")
        expect(calls).toHaveLength(1)
        registry.disable("editor")
        key("keydown", "s")
        expect(calls).toHaveLength(1)
    })

    test("only the detected host scope starts enabled and hosts are exclusive", () => {
        const registry = setup({ host: "desktop" })
        const { calls, handler } = recorder()
        registry.add({ steps: [press("n", "mod")], scopes: ["desktop"] }, handler)
        registry.add({ steps: [press("n", "mod", "shift")], scopes: ["web"] }, handler)
        key("keydown", "n", { ctrlKey: true })
        key("keydown", "N", { ctrlKey: true, shiftKey: true })
        expect(calls.map((call) => call.combo)).toEqual(["mod+n"])
        registry.enable("web")
        expect(registry.isEnabled("desktop")).toBe(false)
        key("keydown", "N", { ctrlKey: true, shiftKey: true })
        expect(calls.map((call) => call.combo)).toEqual(["mod+n", "mod+shift+n"])
    })

    test("only the highest priority fires", () => {
        const registry = setup()
        const low = recorder()
        const high = recorder()
        registry.add({ steps: [press("s")], priority: 1 }, low.handler)
        registry.add({ steps: [press("s")], priority: 5 }, high.handler)
        key("keydown", "s")
        expect(low.calls).toHaveLength(0)
        expect(high.calls).toHaveLength(1)
    })

    test("typing in an input is skipped unless the binding allows it", () => {
        const registry = setup()
        const input = document.createElement("input")
        document.body.append(input)
        const plain = recorder()
        const allowed = recorder()
        registry.add({ steps: [press("s")] }, plain.handler)
        registry.add({ steps: [press("k", "mod")], allowInInputs: true }, allowed.handler)
        key("keydown", "s", {}, input)
        key("keydown", "k", { ctrlKey: true }, input)
        expect(plain.calls).toHaveLength(0)
        expect(allowed.calls).toHaveLength(1)
    })

    test("except rules apply per binding", () => {
        const registry = setup()
        const dialog = document.createElement("dialog")
        dialog.setAttribute("open", "")
        document.body.append(dialog)
        const { calls, handler } = recorder()
        registry.add({ steps: [press("s")], except: ["modal"] }, handler)
        key("keydown", "s")
        expect(calls).toHaveLength(0)
        dialog.remove()
        key("keydown", "s")
        expect(calls).toHaveLength(1)
    })

    test("holds deliver start and release", async () => {
        const registry = setup({ holdThreshold: 20 })
        const { calls, handler } = recorder()
        registry.add({ steps: [{ kind: "hold", key: "c", modifiers: [] }] }, handler)
        key("keydown", "c")
        await sleep(40)
        key("keyup", "c")
        expect(calls.map((call) => ("phase" in call ? call.phase : "press"))).toEqual([
            "start",
            "release",
        ])
    })

    test("list shows active bindings and subscribe fires on change", () => {
        const registry = setup({ scopes: ["app"] })
        const listener = mock(() => {})
        registry.subscribe(listener)
        const handle = registry.add(
            { steps: [press("k", "mod")], scopes: ["app"], description: "Open palette" },
            () => {},
        )
        registry.add({ steps: [press("s")], scopes: ["hidden"] }, () => {})
        expect(registry.list()).toEqual([
            {
                id: handle.id,
                combo: "mod+k",
                display: "Ctrl+K",
                description: "Open palette",
                scopes: ["app"],
                enabled: true,
            },
        ])
        expect(listener).toHaveBeenCalledTimes(2)
        handle.disable()
        expect(listener).toHaveBeenCalledTimes(3)
        expect(registry.list()).toHaveLength(0)
    })

    test("warns about duplicates in a shared scope and browser-owned combos", () => {
        const registry = setup()
        const warnings: string[] = []
        const previous = console.warn
        console.warn = (message: string) => warnings.push(message)
        registry.add({ steps: [press("s")], scopes: ["a"] }, () => {})
        registry.add({ steps: [press("s")], scopes: ["b"] }, () => {})
        registry.add({ steps: [press("s")], scopes: ["a"] }, () => {})
        registry.add({ steps: [press("w", "mod")] }, () => {})
        console.warn = previous
        expect(warnings).toHaveLength(2)
        expect(warnings[0]).toContain("bound twice")
        expect(warnings[1]).toContain("browsers keep")
    })

    test("a strict prefix is not a duplicate", () => {
        const registry = setup()
        const spy = mock(() => {})
        const previous = console.warn
        console.warn = spy
        registry.add({ steps: [press("g")] }, () => {})
        registry.add({ steps: [press("g"), press("d")] }, () => {})
        console.warn = previous
        expect(spy).not.toHaveBeenCalled()
    })

    test("an invalid binding throws in development", () => {
        const registry = setup()
        expect(() => registry.add({ steps: [{ ...press("a"), minDelay: 100 }] }, () => {})).toThrow(
            "starts with a wait",
        )
    })
})

describe("preventDefault and skipped bindings", () => {
    test("a skipped binding does not prevent the typed character", () => {
        const registry = createRegistry({ platform: "other", host: "web" })
        const input = document.createElement("input")
        document.body.append(input)
        registry.add({ steps: [press("s")] }, () => {})
        registry.add({ steps: [press("t")], allowInInputs: true }, () => {})
        const typed = key("keydown", "s", {}, input)
        const allowed = key("keydown", "t", {}, input)
        expect(typed.defaultPrevented).toBe(false)
        expect(allowed.defaultPrevented).toBe(true)
        input.remove()
        registry.destroy()
    })
})

describe("holds inside inputs", () => {
    test("a hold started while typing is skipped, release included", async () => {
        const registry = createRegistry({ platform: "other", host: "web", holdThreshold: 20 })
        const input = document.createElement("input")
        document.body.append(input)
        input.focus()
        const { calls, handler } = recorder()
        registry.add({ steps: [{ kind: "hold", key: "space", modifiers: [] }] }, handler)
        registry.add({ steps: [press("t")], allowInInputs: true }, () => {})
        key("keydown", " ", {}, input)
        await sleep(40)
        key("keyup", " ", {}, input)
        expect(calls).toEqual([])
        input.blur()
        input.remove()
        key("keydown", " ")
        await sleep(40)
        key("keyup", " ")
        expect(calls.map((call) => ("phase" in call ? call.phase : "press"))).toEqual([
            "start",
            "release",
        ])
        registry.destroy()
    })
})
