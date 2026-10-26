import { afterEach, describe, expect, test } from "bun:test"
import { isModalOpen, isTextTarget, shouldSkip } from "../../src/browser/target"
import type { SkipOptions } from "../../src/browser/target"

const DEFAULTS: SkipOptions = { except: [], allowInInputs: false }

function mount<Tag extends keyof HTMLElementTagNameMap>(
    tag: Tag,
    parent: Element = document.body,
): HTMLElementTagNameMap[Tag] {
    const element = document.createElement(tag)
    parent.append(element)
    return element
}

function input(type: string): HTMLInputElement {
    const element = mount("input")
    element.type = type
    return element
}

afterEach(() => {
    document.body.replaceChildren()
})

describe("isTextTarget", () => {
    test("text-like inputs count as typing", () => {
        for (const type of ["text", "email", "password", "search", "number", "url", "tel"]) {
            expect(isTextTarget(input(type))).toBe(true)
        }
    })

    test("non-text input types do not count", () => {
        for (const type of [
            "button",
            "checkbox",
            "radio",
            "submit",
            "reset",
            "file",
            "range",
            "color",
            "image",
            "hidden",
        ]) {
            expect(isTextTarget(input(type))).toBe(false)
        }
    })

    test("textarea and select count", () => {
        expect(isTextTarget(mount("textarea"))).toBe(true)
        expect(isTextTarget(mount("select"))).toBe(true)
    })

    test("contenteditable and its descendants count", () => {
        const editor = mount("div")
        editor.setAttribute("contenteditable", "true")
        const inner = mount("span", mount("p", editor))
        expect(isTextTarget(editor)).toBe(true)
        expect(isTextTarget(inner)).toBe(true)
    })

    test("plain elements, the body, null and non-element nodes do not count", () => {
        expect(isTextTarget(mount("button"))).toBe(false)
        expect(isTextTarget(document.body)).toBe(false)
        expect(isTextTarget(null)).toBe(false)
        expect(isTextTarget(document.createTextNode("k"))).toBe(false)
        expect(isTextTarget(window)).toBe(false)
    })
})

describe("typing rule", () => {
    test("skips in inputs by default", () => {
        expect(shouldSkip(input("text"), DEFAULTS)).toBe(true)
        expect(shouldSkip(mount("textarea"), DEFAULTS)).toBe(true)
    })

    test("allowInInputs opts in", () => {
        expect(shouldSkip(input("text"), { except: [], allowInInputs: true })).toBe(false)
    })

    test("an explicit typing rule still skips with allowInInputs", () => {
        expect(shouldSkip(input("text"), { except: ["typing"], allowInInputs: true })).toBe(true)
    })

    test("does not skip on the body, a button or a null target", () => {
        expect(shouldSkip(document.body, DEFAULTS)).toBe(false)
        expect(shouldSkip(mount("button"), DEFAULTS)).toBe(false)
        expect(shouldSkip(null, DEFAULTS)).toBe(false)
    })
})

describe("modal rule", () => {
    const MODAL: SkipOptions = { except: ["modal"], allowInInputs: false }

    test("nothing is skipped without a modal", () => {
        mount("dialog")
        expect(isModalOpen(document)).toBe(false)
        expect(shouldSkip(document.body, MODAL)).toBe(false)
    })

    test("a dialog opened with showModal blocks targets outside it", () => {
        const dialog = mount("dialog")
        const inside = mount("button", dialog)
        const outside = mount("button")
        dialog.showModal()
        expect(isModalOpen(document)).toBe(true)
        expect(shouldSkip(outside, MODAL)).toBe(true)
        expect(shouldSkip(document.body, MODAL)).toBe(true)
        expect(shouldSkip(null, MODAL)).toBe(true)
        expect(shouldSkip(inside, MODAL)).toBe(false)
        expect(shouldSkip(dialog, MODAL)).toBe(false)
    })

    test("a dialog with the open attribute counts the same", () => {
        const dialog = mount("dialog")
        dialog.setAttribute("open", "")
        expect(isModalOpen(document)).toBe(true)
        expect(shouldSkip(mount("button"), MODAL)).toBe(true)
    })

    test("aria-modal and role dialog count", () => {
        const aria = mount("div")
        aria.setAttribute("aria-modal", "true")
        expect(isModalOpen(document)).toBe(true)
        aria.remove()
        expect(isModalOpen(document)).toBe(false)
        const role = mount("div")
        role.setAttribute("role", "dialog")
        expect(isModalOpen(document)).toBe(true)
        expect(shouldSkip(mount("button", role), MODAL)).toBe(false)
        expect(shouldSkip(mount("button"), MODAL)).toBe(true)
    })

    test("hidden modals do not count", () => {
        const dialog = mount("dialog")
        dialog.setAttribute("open", "")
        dialog.hidden = true
        expect(isModalOpen(document)).toBe(false)
        dialog.hidden = false
        const wrapper = mount("div")
        wrapper.hidden = true
        const role = mount("div", wrapper)
        role.setAttribute("role", "dialog")
        wrapper.append(dialog)
        expect(isModalOpen(document)).toBe(false)
    })

    test("a detached modal does not count", () => {
        const dialog = document.createElement("dialog")
        dialog.setAttribute("open", "")
        expect(isModalOpen(document)).toBe(false)
    })

    test("the modal rule does not disable the typing rule", () => {
        const dialog = mount("dialog")
        dialog.showModal()
        expect(shouldSkip(input("text"), MODAL)).toBe(true)
        expect(shouldSkip(mount("input", dialog), MODAL)).toBe(true)
    })
})

describe("disabled rule", () => {
    const DISABLED: SkipOptions = { except: ["disabled"], allowInInputs: false }

    test("skips a target with the disabled attribute", () => {
        const button = mount("button")
        button.disabled = true
        expect(shouldSkip(button, DISABLED)).toBe(true)
    })

    test("skips a target with aria-disabled true only", () => {
        const button = mount("button")
        button.setAttribute("aria-disabled", "true")
        expect(shouldSkip(button, DISABLED)).toBe(true)
        button.setAttribute("aria-disabled", "false")
        expect(shouldSkip(button, DISABLED)).toBe(false)
    })

    test("skips inside a disabled fieldset", () => {
        const fieldset = mount("fieldset")
        fieldset.disabled = true
        const button = mount("button", mount("div", fieldset))
        expect(shouldSkip(button, DISABLED)).toBe(true)
        fieldset.disabled = false
        expect(shouldSkip(button, DISABLED)).toBe(false)
    })

    test("does not skip enabled targets, the body or null", () => {
        expect(shouldSkip(mount("button"), DISABLED)).toBe(false)
        expect(shouldSkip(document.body, DISABLED)).toBe(false)
        expect(shouldSkip(null, DISABLED)).toBe(false)
    })

    test("disabled is off unless listed", () => {
        const button = mount("button")
        button.disabled = true
        expect(shouldSkip(button, DEFAULTS)).toBe(false)
    })
})

describe("predicates", () => {
    test("a predicate returning true skips and receives the element or null", () => {
        const seen: Array<Element | null> = []
        const options: SkipOptions = {
            except: [
                (target) => {
                    seen.push(target)
                    return target?.tagName === "BUTTON"
                },
            ],
            allowInInputs: false,
        }
        const button = mount("button")
        const div = mount("div")
        expect(shouldSkip(button, options)).toBe(true)
        expect(shouldSkip(div, options)).toBe(false)
        expect(shouldSkip(null, options)).toBe(false)
        expect(shouldSkip(document.createTextNode("k"), options)).toBe(false)
        expect(seen).toEqual([button, div, null, null])
    })

    test("rules combine: any matching rule skips", () => {
        const button = mount("button")
        button.disabled = true
        expect(shouldSkip(button, { except: [() => false, "disabled"], allowInInputs: true })).toBe(
            true,
        )
        expect(shouldSkip(button, { except: [() => false, "modal"], allowInInputs: true })).toBe(
            false,
        )
    })
})
