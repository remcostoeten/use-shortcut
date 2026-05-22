import { describe, expect, it } from "vitest"
import { formatShortcut } from "../formatter"
import { matchesShortcut, parseShortcut } from "../parser"

describe("parser and formatter", () => {
    it("resolves mod with the formatter platform override", () => {
        expect(formatShortcut("mod+s", "mac")).toBe("⌘S")
        expect(formatShortcut("mod+s", "windows")).toBe("Ctrl+S")
    })

    it.each([
        ["plus", "+"],
        ["+", "+"],
        ["minus", "-"],
        ["-", "-"],
        ["equal", "="],
        ["equals", "="],
        ["=", "="],
        ["bracketleft", "["],
        ["openbracket", "["],
        ["[", "["],
        ["bracketright", "]"],
        ["closebracket", "]"],
        ["]", "]"],
        ["slash", "/"],
        ["/", "/"],
        ["backslash", "\\"],
        ["\\", "\\"],
        ["comma", ","],
        [",", ","],
        ["period", "."],
        ["dot", "."],
        [".", "."],
        ["semicolon", ";"],
        [";", ";"],
        ["quote", "'"],
        ["apostrophe", "'"],
        ["'", "'"],
        ["backtick", "`"],
        ["backquote", "`"],
        ["`", "`"],
    ])("normalizes %s to KeyboardEvent.key %s", (token, expected) => {
        expect(parseShortcut(`ctrl+${token}`).key).toBe(expected)
    })

    it("matches literal punctuation keys from keyboard events", () => {
        const parsedPlus = parseShortcut("ctrl++")
        const parsedMinus = parseShortcut("ctrl+-")

        expect(matchesShortcut(new KeyboardEvent("keydown", { key: "+", ctrlKey: true }), parsedPlus)).toBe(true)
        expect(matchesShortcut(new KeyboardEvent("keydown", { key: "-", ctrlKey: true }), parsedMinus)).toBe(true)
    })

    it("keeps legacy hyphen-separated modifiers without stealing the minus key", () => {
        expect(parseShortcut("ctrl-shift-p")).toMatchObject({
            modifiers: { ctrl: true, shift: true },
            key: "p",
        })
        expect(parseShortcut("ctrl+-")).toMatchObject({
            modifiers: { ctrl: true },
            key: "-",
        })
    })
})
