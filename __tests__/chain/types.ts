import { expectTypeOf } from "bun:test"
import { createChain } from "../../src/chain/chain"
import { createRegistry } from "../../src/registry/registry"
import type { HoldEvent, PressEvent } from "../../src/registry/registry"

const shortcut = createChain(["app", "nav", "palette"], createRegistry().add)

function noop() {}

const press = shortcut.mod.key("k").on((event) => {
    expectTypeOf(event).toEqualTypeOf<PressEvent>()
})
expectTypeOf(press.combo).toEqualTypeOf<"mod+k">()
expectTypeOf(press.display).toEqualTypeOf<string>()

const ordered = shortcut.shift.alt.ctrl.key("p").on(() => {})
expectTypeOf(ordered.combo).toEqualTypeOf<"ctrl+alt+shift+p">()

const sequence = shortcut
    .key("g")
    .then.key("d")
    .on(() => {})
expectTypeOf(sequence.combo).toEqualTypeOf<"g then d">()

const waited = shortcut
    .key("a")
    .then.wait(300)
    .hold("c")
    .on(() => {})
expectTypeOf(waited.combo).toEqualTypeOf<"a then wait 300ms then hold c">()

const held = shortcut.hold("space", 300).on((event) => {
    expectTypeOf(event).toEqualTypeOf<HoldEvent>()
    expectTypeOf(event.phase).toEqualTypeOf<"start" | "release">()
})
expectTypeOf(held.combo).toEqualTypeOf<"hold space">()

const mixed = shortcut.mod.rshift
    .key("f")
    .then.meta.hold("g", 800)
    .on(() => {})
expectTypeOf(mixed.combo).toEqualTypeOf<"mod+rshift+f then hold meta+g">()

expectTypeOf(shortcut.key("a").in)
    .parameter(0)
    .toEqualTypeOf<"app" | "nav" | "palette" | readonly ("app" | "nav" | "palette")[]>()

shortcut
    .key("g")
    .then.key("d")
    .in(["nav", "app"])
    .except("modal")
    .priority(1)
    .allowInInputs()
    .describe("Dashboard")
    .on(() => {})

const partial = shortcut.mod
partial.key("a").on(() => {})
partial.key("b").on(() => {})

// @ts-expect-error a modifier cannot repeat
void shortcut.mod.mod
// @ts-expect-error mod excludes ctrl
void shortcut.mod.ctrl
// @ts-expect-error mod excludes meta
void shortcut.mod.meta
// @ts-expect-error ctrl excludes mod
void shortcut.ctrl.mod
// @ts-expect-error shift excludes lshift
void shortcut.shift.lshift
// @ts-expect-error lshift excludes rshift
void shortcut.lshift.rshift
// @ts-expect-error rshift excludes shift
void shortcut.rshift.shift
// @ts-expect-error wait cannot follow another wait
void shortcut.key("a").then.wait(300).wait(300)
// @ts-expect-error wait cannot be followed by on
void shortcut.key("a").then.wait(300).on(noop)
// @ts-expect-error wait cannot be first
void shortcut.wait(300)
// @ts-expect-error wait cannot follow a key directly
void shortcut.key("a").wait(300)
// @ts-expect-error on is unavailable before a key
void shortcut.mod.on(noop)
// @ts-expect-error on is unavailable on a bare then
void shortcut.key("a").then.on(noop)
// @ts-expect-error an option can be used once
void shortcut.key("a").in("app").in("nav")
// @ts-expect-error describe can be used once
void shortcut.key("a").describe("x").describe("y")
// @ts-expect-error options end the chain, so then is gone
void shortcut.key("a").in("app").then
// @ts-expect-error scope names come from createChain
void shortcut.key("a").in("typo")
// @ts-expect-error key names are a closed union
void shortcut.key("escpae")
// @ts-expect-error a press handler has no phase
void shortcut.key("a").on((event) => event.phase)
// @ts-expect-error a hold handler has no keyboard event
void shortcut.hold("a").on((event) => event.event)

const alternatives = shortcut
    .key("escape")
    .or.mod.key("d")
    .in("app")
    .on(() => {})
expectTypeOf(alternatives.combo).toEqualTypeOf<"escape | mod+d">()
// @ts-expect-error or needs a step before an option
void shortcut.key("escape").or.in("app")
