import { afterEach, describe, expect, test } from "bun:test"
import { detectHost, detectPlatform } from "../../../src/shared/helpers/environment"

afterEach(() => {
    Reflect.deleteProperty(globalThis, "isTauri")
})

describe("detectPlatform", () => {
    test("answers other on the test platform", () => {
        expect(detectPlatform()).toBe("other")
    })
})

describe("detectHost", () => {
    test("answers web without the Tauri flag", () => {
        expect(detectHost()).toBe("web")
    })

    test("answers desktop when Tauri 2 sets isTauri", () => {
        Object.defineProperty(globalThis, "isTauri", { value: true, configurable: true })
        expect(detectHost()).toBe("desktop")
    })

    test("ignores a flag that is not exactly true", () => {
        Object.defineProperty(globalThis, "isTauri", { value: "yes", configurable: true })
        expect(detectHost()).toBe("web")
    })
})
