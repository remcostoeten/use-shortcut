import { afterEach, describe, expect, it } from "vitest"
import { formatShortcut, formatShortcutSteps } from "../formatter"
import {
    canonicalizeShortcut,
    findShortcutConflict,
    sameShortcut,
    shortcutConflict,
} from "../rebinding"
import {
    _EXCEPT_PREDICATES,
    _resetModalSelectorCache,
    _resolveModalSelector,
    _shouldExcept,
} from "../runtime/guards"

function keydown(target?: EventTarget): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { key: "k" })
    if (target) {
        Object.defineProperty(event, "target", { value: target, configurable: true })
    }
    return event
}

describe("modal except preset", () => {
    afterEach(() => {
        document.body.innerHTML = ""
        _resetModalSelectorCache()
    })

    it("detects an open native dialog", () => {
        document.body.innerHTML = "<dialog open>confirm</dialog>"
        expect(_EXCEPT_PREDICATES.modal(keydown())).toBe(true)
    })

    it("ignores a closed native dialog", () => {
        document.body.innerHTML = "<dialog>confirm</dialog>"
        expect(_EXCEPT_PREDICATES.modal(keydown())).toBe(false)
    })

    it("still detects the aria and data-attribute forms", () => {
        document.body.innerHTML = '<div role="dialog"></div>'
        expect(_EXCEPT_PREDICATES.modal(keydown())).toBe(true)

        document.body.innerHTML = '<div data-modal="true"></div>'
        expect(_EXCEPT_PREDICATES.modal(keydown())).toBe(true)
    })

    it("reports no modal on a bare document", () => {
        expect(_EXCEPT_PREDICATES.modal(keydown())).toBe(false)
    })

    // jsdom implements neither `:modal` nor `showModal()`, so the suite above
    // only ever exercises the attribute fallback. These two pin the branch
    // choice itself, which is the part that differs in a real browser.
    it("prefers the top-layer selector where :modal parses", () => {
        const querySelector = document.querySelector.bind(document)
        document.querySelector = ((selector: string) =>
            querySelector(selector.replace("dialog:modal", "dialog"))) as typeof document.querySelector

        try {
            expect(_resolveModalSelector()).toContain("dialog:modal")
        } finally {
            document.querySelector = querySelector
        }
    })

    it("falls back to the attribute selector where :modal throws", () => {
        expect(_resolveModalSelector()).toContain("dialog[open]")
        expect(_resolveModalSelector()).not.toContain("dialog:modal")
    })
})

describe("except accepts mixed presets and predicates", () => {
    afterEach(() => {
        document.body.innerHTML = ""
        _resetModalSelectorCache()
    })

    it("vetoes via a preset in a mixed array", () => {
        const input = document.createElement("input")
        expect(_shouldExcept(keydown(input), ["typing", () => false])).toBe(true)
    })

    it("vetoes via a custom predicate in a mixed array", () => {
        const div = document.createElement("div")
        div.className = "sidebar-tree"
        const inSidebar = (event: KeyboardEvent) =>
            event.target instanceof HTMLElement &&
            event.target.closest(".sidebar-tree") !== null

        expect(_shouldExcept(keydown(div), ["typing", inSidebar])).toBe(true)
    })

    it("allows the keypress when nothing in the array vetoes", () => {
        const div = document.createElement("div")
        expect(_shouldExcept(keydown(div), ["typing", "modal", () => false])).toBe(false)
    })

    it("keeps the single-preset and single-predicate forms working", () => {
        const input = document.createElement("input")
        expect(_shouldExcept(keydown(input), "typing")).toBe(true)
        expect(_shouldExcept(keydown(input), () => false)).toBe(false)
        expect(_shouldExcept(keydown(input), ["input", "editable"])).toBe(true)
        expect(_shouldExcept(keydown(input), undefined)).toBe(false)
    })
})

describe("sequence-aware formatting", () => {
    it("formats each step of a sequence", () => {
        expect(formatShortcutSteps("g then d", "windows")).toEqual(["G", "D"])
        expect(formatShortcut("g then d", "windows")).toBe("G then D")
    })

    it("formats modifiers inside sequence steps", () => {
        expect(formatShortcutSteps("g then mod+1", "mac")).toEqual(["G", "⌘1"])
    })

    it("handles the bare-space sequence form", () => {
        expect(formatShortcutSteps("g t 1", "windows")).toEqual(["G", "T", "1"])
    })

    it("returns a single step for a plain chord", () => {
        expect(formatShortcutSteps("mod+s", "mac")).toEqual(["⌘S"])
        expect(formatShortcut("mod+s", "mac")).toBe("⌘S")
    })

    it("rejects an empty combo", () => {
        expect(() => formatShortcutSteps("   ", "mac")).toThrow("Invalid shortcut")
    })
})

describe("rebinding helpers", () => {
    it("canonicalizes spelling, casing, and mod", () => {
        expect(canonicalizeShortcut("Ctrl + K", "windows")).toBe("ctrl+k")
        expect(canonicalizeShortcut("mod+k", "windows")).toBe("ctrl+k")
        expect(canonicalizeShortcut("mod+k", "mac")).toBe("cmd+k")
        expect(canonicalizeShortcut("g then D", "windows")).toBe("g then d")
    })

    it("orders modifiers canonically regardless of input order", () => {
        expect(canonicalizeShortcut("shift+ctrl+alt+p", "windows")).toBe(
            canonicalizeShortcut("ctrl+alt+shift+p", "windows"),
        )
    })

    it("compares combos by meaning, not text", () => {
        expect(sameShortcut("mod+k", "ctrl+k", "windows")).toBe(true)
        expect(sameShortcut("mod+k", "ctrl+k", "mac")).toBe(false)
        expect(sameShortcut("mod+k", "mod+j", "windows")).toBe(false)
        expect(sameShortcut("g then d", "g then d", "windows")).toBe(true)
    })

    it("falls back to text comparison for unparseable combos", () => {
        expect(sameShortcut("", "", "windows")).toBe(true)
        expect(sameShortcut("", "mod+k", "windows")).toBe(false)
    })

    it("classifies exact and sequence-prefix conflicts", () => {
        expect(shortcutConflict("mod+k", "ctrl+k", "windows")).toBe("exact")
        expect(shortcutConflict("g", "g then d", "windows")).toBe("sequence-prefix")
        expect(shortcutConflict("g then d", "g", "windows")).toBe("sequence-prefix")
        expect(shortcutConflict("mod+k", "mod+j", "windows")).toBeNull()
    })

    it("finds the first colliding binding in a set", () => {
        expect(findShortcutConflict("mod+k", ["mod+s", "ctrl+k"], "windows")).toEqual({
            combo: "ctrl+k",
            reason: "exact",
        })
        expect(findShortcutConflict("mod+k", ["mod+s", "mod+j"], "windows")).toBeNull()
    })

    it("skips unparseable existing combos instead of throwing", () => {
        expect(findShortcutConflict("mod+k", ["", "ctrl+k"], "windows")).toEqual({
            combo: "ctrl+k",
            reason: "exact",
        })
    })
})
