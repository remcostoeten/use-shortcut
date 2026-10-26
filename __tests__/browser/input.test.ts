import { describe, expect, test } from "bun:test"
import { toKeyInput } from "../../src/browser/input"

describe("toKeyInput", () => {
    test("copies key, modifiers, repeat, composing and time", () => {
        const event = new KeyboardEvent("keydown", {
            key: "K",
            ctrlKey: true,
            shiftKey: true,
            repeat: true,
        })
        const input = toKeyInput(event, "down")
        expect(input).toEqual({
            phase: "down",
            key: "K",
            code: "",
            location: null,
            ctrl: true,
            alt: false,
            meta: false,
            shift: true,
            repeat: true,
            composing: false,
            time: event.timeStamp,
        })
    })

    test("maps the DOM location to a side", () => {
        expect(
            toKeyInput(new KeyboardEvent("keydown", { key: "Shift", location: 1 }), "down")
                .location,
        ).toBe("left")
        expect(
            toKeyInput(new KeyboardEvent("keyup", { key: "Shift", location: 2 }), "up").location,
        ).toBe("right")
    })
})
