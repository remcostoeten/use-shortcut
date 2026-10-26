import { describe, expect, test } from "bun:test"
import type { StepInput } from "../../src/core/step"
import { displayCombo, formatCombo } from "../../src/registry/combo"

const modK: StepInput = { kind: "press", key: "k", modifiers: ["mod"] }
const shiftSlash: StepInput = { kind: "press", key: "slash", modifiers: ["shift", "ctrl"] }
const s: StepInput = { kind: "press", key: "s", modifiers: [] }
const waitB: StepInput = { kind: "press", key: "b", modifiers: [], minDelay: 300 }
const holdC: StepInput = { kind: "hold", key: "c", modifiers: [] }

describe("formatCombo", () => {
    test("writes modifiers in a fixed order and steps with then", () => {
        expect(formatCombo([modK])).toBe("mod+k")
        expect(formatCombo([shiftSlash])).toBe("ctrl+shift+slash")
        expect(formatCombo([modK, s])).toBe("mod+k then s")
    })

    test("writes waits and holds", () => {
        expect(formatCombo([s, waitB, holdC])).toBe("s then wait 300ms then b then hold c")
    })
})

describe("displayCombo", () => {
    test("uses symbols on a Mac and words elsewhere", () => {
        expect(displayCombo([modK], "mac")).toBe("⌘K")
        expect(displayCombo([modK], "other")).toBe("Ctrl+K")
        expect(displayCombo([shiftSlash], "mac")).toBe("⌃⇧/")
        expect(displayCombo([shiftSlash], "other")).toBe("Ctrl+Shift+/")
    })

    test("labels named keys and leaves waits out", () => {
        const escape: StepInput = { kind: "press", key: "escape", modifiers: [] }
        const up: StepInput = { kind: "press", key: "up", modifiers: ["alt"] }
        expect(displayCombo([escape], "other")).toBe("Esc")
        expect(displayCombo([up], "mac")).toBe("⌥↑")
        expect(displayCombo([s, waitB, holdC], "other")).toBe("S B hold C")
    })
})
