import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import * as rootEntry from "../index"
import * as reactEntry from "../react"
import * as parserEntry from "../parser"
import * as formatterEntry from "../formatter"
import * as constantsEntry from "../constants"
import * as rebindingEntry from "../rebinding"

const packageJson = JSON.parse(
    readFileSync(join(process.cwd(), "package.json"), "utf8"),
) as {
    exports: Record<string, unknown>
}

describe("package entrypoints", () => {
    it("keeps the documented subpath exports in package.json", () => {
        expect(Object.keys(packageJson.exports)).toEqual([
            ".",
            "./react",
            "./parser",
            "./formatter",
            "./constants",
            "./rebinding",
        ])
    })

    it("exposes the React surface from the react entrypoint", () => {
        expect(reactEntry.useShortcut).toBeTypeOf("function")
        expect(reactEntry.useShortcutBinding).toBeTypeOf("function")
        expect(reactEntry.useShortcutMap).toBeTypeOf("function")
        expect(reactEntry.registerShortcutMap).toBeTypeOf("function")
        expect(reactEntry.createShortcutGroup).toBeTypeOf("function")
        expect(reactEntry.useShortcutGroup).toBeTypeOf("function")
    })

    it("exposes parser helpers from the parser entrypoint", () => {
        expect(parserEntry.parseShortcut).toBeTypeOf("function")
        expect(parserEntry.parseShortcuts).toBeTypeOf("function")
        expect(parserEntry.matchesShortcut).toBeTypeOf("function")
        expect(parserEntry.matchesAnyShortcut).toBeTypeOf("function")
    })

    it("exposes formatter helpers from the formatter entrypoint", () => {
        expect(formatterEntry.formatShortcut).toBeTypeOf("function")
        expect(formatterEntry.formatShortcutSteps).toBeTypeOf("function")
        expect(formatterEntry.getModifierSymbols).toBeTypeOf("function")
    })

    it("exposes rebinding helpers from the rebinding entrypoint", () => {
        expect(rebindingEntry.canonicalizeShortcut).toBeTypeOf("function")
        expect(rebindingEntry.sameShortcut).toBeTypeOf("function")
        expect(rebindingEntry.shortcutConflict).toBeTypeOf("function")
        expect(rebindingEntry.findShortcutConflict).toBeTypeOf("function")
    })

    it("exposes platform constants from the constants entrypoint", () => {
        expect(constantsEntry.ModifierKey).toBeDefined()
        expect(constantsEntry.ModifierAliases).toBeDefined()
        expect(constantsEntry.SpecialKeyMap).toBeDefined()
        expect(constantsEntry.ModifierDisplaySymbols).toBeDefined()
        expect(constantsEntry.ModifierDisplayOrder).toBeDefined()
        expect(constantsEntry.Platform).toBeDefined()
        expect(constantsEntry.detectPlatform).toBeTypeOf("function")
    })

    it("re-exports the formatter and rebinding surfaces from the root barrel", () => {
        expect(rootEntry.formatShortcutSteps).toBe(formatterEntry.formatShortcutSteps)
        expect(rootEntry.canonicalizeShortcut).toBe(rebindingEntry.canonicalizeShortcut)
        expect(rootEntry.sameShortcut).toBe(rebindingEntry.sameShortcut)
        expect(rootEntry.shortcutConflict).toBe(rebindingEntry.shortcutConflict)
        expect(rootEntry.findShortcutConflict).toBe(rebindingEntry.findShortcutConflict)
    })

    it("keeps the root barrel compatible with the React-first surface", () => {
        expect(rootEntry.useShortcut).toBe(reactEntry.useShortcut)
        expect(rootEntry.useShortcutBinding).toBe(reactEntry.useShortcutBinding)
        expect(rootEntry.useShortcutMap).toBe(reactEntry.useShortcutMap)
        expect(rootEntry.registerShortcutMap).toBe(reactEntry.registerShortcutMap)
        expect(rootEntry.createShortcutGroup).toBe(reactEntry.createShortcutGroup)
        expect(rootEntry.useShortcutGroup).toBe(reactEntry.useShortcutGroup)
    })
})
