import { expect, test } from "bun:test"

test("the DOM is registered for tests", () => {
    const input = document.createElement("input")
    document.body.append(input)
    input.focus()
    expect(document.activeElement).toBe(input)
    expect(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }).ctrlKey).toBe(true)
})
