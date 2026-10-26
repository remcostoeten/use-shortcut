import { describe, expect, expectTypeOf, it } from "bun:test"
import { KEY_NAMES } from "../../../src/shared/vocabulary"
import type { KeyName, Modifier } from "../../../src/shared/types/semantic"

describe("vocabulary", () => {
    it("keeps key names a closed union", () => {
        expectTypeOf<string>().not.toMatchTypeOf<KeyName>()
        expectTypeOf<"escape" | "f12" | "a" | "0">().toMatchTypeOf<KeyName>()
        expect(KEY_NAMES).toHaveLength(26 + 10 + 12 + 23 + 2)
    })

    it("keeps modifiers a closed union", () => {
        expectTypeOf<string>().not.toMatchTypeOf<Modifier>()
    })
})

// @ts-expect-error a typo is not a key name
export const typo: KeyName = "escpae"
// @ts-expect-error a typo is not a modifier
export const badModifier: Modifier = "command"
