import { afterEach, describe, expect, mock, test } from "bun:test"
import { isProduction, throwInDev, warnInDev } from "../../../src/shared/helpers/dev"

const original = process.env.NODE_ENV ?? "test"

afterEach(() => {
    process.env.NODE_ENV = original
})

describe("dev helpers", () => {
    test("throws outside production", () => {
        process.env.NODE_ENV = "development"
        expect(isProduction()).toBe(false)
        expect(() => throwInDev("use-shortcut: boom")).toThrow("use-shortcut: boom")
    })

    test("warns in production", () => {
        process.env.NODE_ENV = "production"
        const spy = mock(() => {})
        const previous = console.warn
        console.warn = spy
        throwInDev("use-shortcut: boom")
        warnInDev("use-shortcut: quiet")
        console.warn = previous
        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith("use-shortcut: boom")
    })

    test("warnInDev prints only outside production", () => {
        process.env.NODE_ENV = "development"
        const spy = mock(() => {})
        const previous = console.warn
        console.warn = spy
        warnInDev("use-shortcut: quiet")
        console.warn = previous
        expect(spy).toHaveBeenCalledWith("use-shortcut: quiet")
    })
})
