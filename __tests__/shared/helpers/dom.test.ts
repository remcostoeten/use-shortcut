import { describe, expect, test } from "bun:test"
import { documentOf, elementOf } from "../../../src/shared/helpers/dom"

describe("dom helpers", () => {
    test("elementOf keeps elements and drops everything else", () => {
        const div = document.createElement("div")
        expect(elementOf(div)).toBe(div)
        expect(elementOf(document.createTextNode("x"))).toBeNull()
        expect(elementOf(window)).toBeNull()
        expect(elementOf(null)).toBeNull()
    })

    test("documentOf finds the owning document", () => {
        const div = document.createElement("div")
        expect(documentOf(div)).toBe(document)
        expect(documentOf(document)).toBe(document)
        expect(documentOf(window)).toBe(document)
        expect(documentOf(null)).toBe(document)
    })
})
