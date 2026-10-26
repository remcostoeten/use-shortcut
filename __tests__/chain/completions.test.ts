import { afterAll, describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import ts from "typescript"

const root = resolve(import.meta.dir, "../..")
const probePath = resolve(root, "__tests__/chain/probe.ts")

const header = [
    'import { createChain } from "../../src/chain/chain"',
    'import { createRegistry } from "../../src/registry/registry"',
    'const shortcut = createChain(["app", "nav"], createRegistry().add)',
    "",
].join("\n")

function compilerOptions(): ts.CompilerOptions {
    const parsed = ts.getParsedCommandLineOfConfigFile(
        resolve(root, "tsconfig.json"),
        {},
        { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} },
    )
    return parsed?.options ?? {}
}

function createProbe() {
    let current = ""
    const options = compilerOptions()
    const service = ts.createLanguageService({
        getCompilationSettings: () => options,
        getScriptFileNames: () => [probePath],
        getScriptVersion: (file) => (file === probePath ? current : "0"),
        getScriptSnapshot: (file) => {
            if (file === probePath) return ts.ScriptSnapshot.fromString(current)
            if (!ts.sys.fileExists(file)) return undefined
            return ts.ScriptSnapshot.fromString(readFileSync(file, "utf8"))
        },
        getCurrentDirectory: () => root,
        getDefaultLibFileName: ts.getDefaultLibFilePath,
        fileExists: (file) => file === probePath || ts.sys.fileExists(file),
        readFile: (file) => (file === probePath ? current : ts.sys.readFile(file)),
        readDirectory: ts.sys.readDirectory,
        directoryExists: ts.sys.directoryExists,
        getDirectories: ts.sys.getDirectories,
    })

    function place(snippet: string): number {
        const cursor = snippet.indexOf("|")
        current = header + snippet.replace("|", "")
        return header.length + cursor
    }

    return {
        completions: (snippet: string) => {
            const position = place(snippet)
            const info = service.getCompletionsAtPosition(probePath, position, {})
            return (info?.entries ?? []).map((entry) => entry.name).sort()
        },
        hover: (snippet: string) => {
            const position = place(snippet)
            const info = service.getQuickInfoAtPosition(probePath, position)
            return {
                type: ts.displayPartsToString(info?.displayParts),
                docs: (info?.tags ?? [])
                    .map((tag) => `${tag.name} ${ts.displayPartsToString(tag.text)}`)
                    .join("\n"),
            }
        },
        dispose: () => service.dispose(),
    }
}

const probe = createProbe()
afterAll(() => probe.dispose())

const MODIFIERS = ["alt", "ctrl", "lshift", "meta", "mod", "rshift", "shift"]
const OPTIONS = ["allowInInputs", "describe", "except", "in", "priority"]

describe("autocomplete", () => {
    test("the root offers every modifier, key and hold", () => {
        expect(probe.completions("shortcut.|")).toEqual([...MODIFIERS, "hold", "key"].sort())
    })

    test("after mod, ctrl, meta and mod are gone", () => {
        const names = probe.completions("shortcut.mod.|")
        expect(names).toEqual(["alt", "hold", "key", "lshift", "rshift", "shift"])
        expect(names).not.toContain("ctrl")
        expect(names).not.toContain("meta")
        expect(names).not.toContain("mod")
    })

    test("after shift, the sided shifts are gone", () => {
        const names = probe.completions("shortcut.shift.|")
        expect(names).toEqual(["alt", "ctrl", "hold", "key", "meta", "mod"])
    })

    test("after a key, then, the options and on are offered", () => {
        expect(probe.completions('shortcut.key("k").|')).toEqual(
            [...OPTIONS, "on", "or", "then"].sort(),
        )
    })

    test("after then, wait joins the step starters", () => {
        expect(probe.completions('shortcut.key("a").then.|')).toEqual(
            [...MODIFIERS, "hold", "key", "wait"].sort(),
        )
    })

    test("after wait, only a step can follow", () => {
        const names = probe.completions('shortcut.key("a").then.wait(300).|')
        expect(names).toEqual([...MODIFIERS, "hold", "key"].sort())
        expect(names).not.toContain("wait")
        expect(names).not.toContain("on")
    })

    test("a used option disappears and then is gone", () => {
        expect(probe.completions('shortcut.key("a").in("app").|')).toEqual([
            "allowInInputs",
            "describe",
            "except",
            "on",
            "priority",
        ])
    })

    test("scope names come from createChain plus the hosts", () => {
        expect(probe.completions('shortcut.key("a").in("|")')).toEqual([
            "app",
            "desktop",
            "nav",
            "web",
        ])
    })

    test("key names are a closed union", () => {
        const names = probe.completions('shortcut.key("|")')
        expect(names).toContain("escape")
        expect(names).toContain("f12")
        expect(names).toHaveLength(26 + 10 + 12 + 23 + 2)
    })
})

describe("hover", () => {
    test("mod shows its description", () => {
        const hover = probe.hover("shortcut.m|od")
        expect(hover.docs).toContain("name mod")
        expect(hover.docs).toContain("Requires Cmd on a Mac and Ctrl elsewhere")
    })

    test("a surviving modifier keeps its docs after another one", () => {
        expect(probe.hover("shortcut.mod.sh|ift").docs).toContain("Requires Shift, either side")
    })

    test("options and on keep their docs", () => {
        expect(probe.hover('shortcut.key("a").i|n("app")').docs).toContain("Limits the binding")
        expect(probe.hover('shortcut.key("a").o|n(() => {})').docs).toContain(
            "Registers the binding",
        )
    })
})
