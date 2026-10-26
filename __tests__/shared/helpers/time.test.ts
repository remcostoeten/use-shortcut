import { describe, expect, test } from "bun:test"
import { delayUntil, earliest, isDue } from "../../../src/shared/helpers/time"

describe("time helpers", () => {
    test("a deadline is due the moment it is reached", () => {
        expect(isDue(99, 100)).toBe(false)
        expect(isDue(100, 100)).toBe(true)
        expect(isDue(101, 100)).toBe(true)
    })

    test("a delay never goes negative", () => {
        expect(delayUntil(150, 100)).toBe(50)
        expect(delayUntil(100, 100)).toBe(0)
        expect(delayUntil(50, 100)).toBe(0)
    })

    test("earliest picks the first deadline or null", () => {
        expect(earliest([300, 100, 200])).toBe(100)
        expect(earliest([])).toBeNull()
    })
})
