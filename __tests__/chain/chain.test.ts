import { afterEach, describe, expect, mock, test } from "bun:test"
import { createChain } from "../../src/chain/chain"
import { displayCombo, formatCombo } from "../../src/registry/combo"
import { createRegistry } from "../../src/registry/registry"
import type {
    BindingDefinition,
    Handle,
    Handler,
    Registry,
    ShortcutEvent,
} from "../../src/registry/registry"

const registries: Registry[] = []

afterEach(() => {
    registries.forEach((registry) => registry.destroy())
    registries.length = 0
})

function fakeHandle(): Handle {
    return {
        id: "binding-1",
        combo: "fake",
        display: "Fake",
        isEnabled: () => true,
        enable: () => {},
        disable: () => {},
        unbind: () => {},
        trigger: () => {},
    }
}

function setup() {
    const handle = fakeHandle()
    const add = mock((definition: BindingDefinition, handler: Handler) => {
        void definition
        void handler
        return handle
    })
    const registry: Registry = {
        add,
        enable: () => {},
        disable: () => {},
        isEnabled: () => true,
        list: () => [],
        subscribe: () => () => {},
        interrupt: () => {},
        destroy: () => {},
    }
    const shortcut = createChain(["app", "nav"], registry.add)
    function definition(): BindingDefinition | undefined {
        return add.mock.calls[0]?.[0]
    }
    return { shortcut, add, handle, definition }
}

function noop() {}

describe("createChain", () => {
    test("a modifier combo becomes one press step and the handle comes back", () => {
        const { shortcut, add, handle, definition } = setup()
        const result = shortcut.mod.shift.key("k").on(noop)
        expect(add).toHaveBeenCalledTimes(1)
        expect(definition()).toEqual({
            steps: [{ kind: "press", key: "k", modifiers: ["mod", "shift"] }],
        })
        expect<Handle>(result).toBe(handle)
    })

    test("the handler is passed through untouched", () => {
        const { shortcut, add } = setup()
        function handler(event: ShortcutEvent) {
            void event
        }
        shortcut.key("a").on(handler)
        expect(add.mock.calls[0]?.[1]).toBe(handler)
    })

    test("then adds steps and wait sets minDelay on the next step", () => {
        const { shortcut, definition } = setup()
        shortcut.key("g").then.key("d").then.wait(300).alt.key("x").on(noop)
        expect(definition()?.steps).toEqual([
            { kind: "press", key: "g", modifiers: [] },
            { kind: "press", key: "d", modifiers: [] },
            { kind: "press", key: "x", modifiers: ["alt"], minDelay: 300 },
        ])
    })

    test("hold sets the kind and the threshold", () => {
        const { shortcut, definition } = setup()
        shortcut.hold("space", 800).then.hold("b").on(noop)
        expect(definition()?.steps).toEqual([
            { kind: "hold", key: "space", modifiers: [], threshold: 800 },
            { kind: "hold", key: "b", modifiers: [] },
        ])
    })

    test("in accepts one scope or many", () => {
        const one = setup()
        one.shortcut.key("a").in("app").on(noop)
        expect(one.definition()?.scopes).toEqual(["app"])
        const many = setup()
        many.shortcut.key("a").in(["app", "nav"]).on(noop)
        expect(many.definition()?.scopes).toEqual(["app", "nav"])
    })

    test("every option lands in the definition", () => {
        const { shortcut, definition } = setup()
        function predicate() {
            return false
        }
        shortcut.mod
            .key("k")
            .in("app")
            .except(predicate)
            .allowInInputs()
            .priority(5)
            .describe("Open the palette")
            .on(noop)
        expect(definition()).toEqual({
            steps: [{ kind: "press", key: "k", modifiers: ["mod"] }],
            scopes: ["app"],
            except: [predicate],
            allowInInputs: true,
            priority: 5,
            description: "Open the palette",
        })
    })

    test("a partial chain can be reused without leaking state", () => {
        const { shortcut, add } = setup()
        const mod = shortcut.mod
        mod.key("a").on(noop)
        mod.alt.key("b").describe("b").on(noop)
        mod.key("c").on(noop)
        expect(add.mock.calls.map((call) => call[0])).toEqual([
            { steps: [{ kind: "press", key: "a", modifiers: ["mod"] }] },
            { steps: [{ kind: "press", key: "b", modifiers: ["mod", "alt"] }], description: "b" },
            { steps: [{ kind: "press", key: "c", modifiers: ["mod"] }] },
        ])
    })

    test("a custom bind replaces registry.add", () => {
        const registry = createRegistry({ platform: "other", host: "web" })
        registries.push(registry)
        const calls: BindingDefinition[] = []
        function bind(definition: BindingDefinition) {
            calls.push(definition)
            return fakeHandle()
        }
        const shortcut = createChain(["app"], bind)
        shortcut.key("z").in("app").on(noop)
        expect(calls).toEqual([
            { steps: [{ kind: "press", key: "z", modifiers: [] }], scopes: ["app"] },
        ])
        expect(registry.list()).toHaveLength(0)
    })

    test("a real registry fires a chain-built binding", () => {
        const registry = createRegistry({ platform: "other", host: "web", scopes: ["app"] })
        registries.push(registry)
        const shortcut = createChain(["app"], registry.add)
        const calls: ShortcutEvent[] = []
        const handle = shortcut.mod
            .key("k")
            .in("app")
            .describe("Palette")
            .on((event) => calls.push(event))
        const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, cancelable: true })
        window.dispatchEvent(event)
        expect(calls).toEqual([{ combo: "mod+k", event }])
        expect(handle.combo).toBe("mod+k")
        expect(handle.display).toBe("Ctrl+K")
        expect(registry.list()[0]?.description).toBe("Palette")
    })
})

describe("alternatives", () => {
    test("or registers one binding per alternative under one handle", () => {
        const definitions: BindingDefinition[] = []
        const unbound: string[] = []
        let count = 0
        function bind(definition: BindingDefinition): Handle {
            definitions.push(definition)
            count += 1
            const id = `b${count}`
            return {
                id,
                combo: formatCombo(definition.steps),
                display: displayCombo(definition.steps, "other"),
                isEnabled: () => true,
                enable: () => {},
                disable: () => {},
                unbind: () => unbound.push(id),
                trigger: () => {},
            }
        }
        const shortcut = createChain(["app"], bind)
        const handle = shortcut
            .key("escape")
            .or.mod.key("d")
            .in("app")
            .on(() => {})
        expect(definitions.map((definition) => definition.steps)).toEqual([
            [{ kind: "press", key: "escape", modifiers: [] }],
            [{ kind: "press", key: "d", modifiers: ["mod"] }],
        ])
        expect(definitions.every((definition) => definition.scopes?.includes("app"))).toBe(true)
        const combo: "escape | mod+d" = handle.combo
        expect(combo).toBe("escape | mod+d")
        expect(handle.display).toBe("Esc / Ctrl+D")
        handle.unbind()
        expect(unbound).toEqual(["b1", "b2"])
    })
})
