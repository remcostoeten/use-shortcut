import fs from "fs"
import path from "path"
import ts from "typescript"

const _ROOT = process.cwd()
const _SRC_DIR = path.join(_ROOT, "src")
const _ENTRY = path.join(_SRC_DIR, "index.ts")
const _OUT_DIR = path.join(_ROOT, "docs-input")
const _OUT_JSON = path.join(_OUT_DIR, "api-reference.json")
const _OUT_MD = path.join(_OUT_DIR, "api-reference.md")

function _ensureOutDir() {
    fs.mkdirSync(_OUT_DIR, { recursive: true })
}

function _getKind(decl) {
    if (ts.isFunctionDeclaration(decl)) return "function"
    if (ts.isTypeAliasDeclaration(decl) || ts.isInterfaceDeclaration(decl)) return "type"
    if (ts.isVariableDeclaration(decl) || ts.isVariableStatement(decl)) return "const"
    if (ts.isEnumDeclaration(decl)) return "enum"
    return "symbol"
}

function _getLocation(decl) {
    const sf = decl.getSourceFile()
    const pos = sf.getLineAndCharacterOfPosition(decl.getStart())
    return {
        file: path.relative(_ROOT, sf.fileName).replaceAll(path.sep, "/"),
        line: pos.line + 1,
        column: pos.character + 1,
    }
}

function _extractTags(tags) {
    const out = {
        params: [],
        returns: null,
        examples: [],
    }

    for (const tag of tags) {
        if (tag.name === "param") {
            const [paramName, ...rest] = (tag.text ?? []).map((part) => part.text)
            out.params.push({
                name: paramName ?? "",
                description: rest.join("").trim(),
            })
        }

        if (tag.name === "returns" || tag.name === "return") {
            out.returns = (tag.text ?? []).map((part) => part.text).join("").trim()
        }

        if (tag.name === "example") {
            out.examples.push((tag.text ?? []).map((part) => part.text).join(""))
        }
    }

    return out
}

function _parsePublicExports(program, checker) {
    const entryFile = program.getSourceFile(_ENTRY)
    if (!entryFile) {
        throw new Error(`Missing entry file: ${_ENTRY}`)
    }

    const items = []

    for (const statement of entryFile.statements) {
        if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier) continue
        if (!statement.exportClause || !ts.isNamedExports(statement.exportClause)) continue

        const spec = statement.moduleSpecifier
        const moduleSymbol = checker.getSymbolAtLocation(spec)
        if (!moduleSymbol) continue

        const moduleExports = checker.getExportsOfModule(moduleSymbol)
        const byName = new Map(moduleExports.map((s) => [s.getName(), s]))

        for (const element of statement.exportClause.elements) {
            const name = element.name.text
            const symbol = byName.get(name)
            if (!symbol) continue

            const declarations = symbol.getDeclarations() ?? []
            const declaration = declarations[0]
            if (!declaration) continue

            const kind = _getKind(declaration)
            const docs = ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim()
            const tags = _extractTags(symbol.getJsDocTags())
            const loc = _getLocation(declaration)

            let signature = null
            if (kind === "function") {
                const type = checker.getTypeOfSymbolAtLocation(symbol, declaration)
                const sig = type.getCallSignatures()[0]
                if (sig) {
                    signature = checker.signatureToString(sig, undefined, ts.TypeFormatFlags.NoTruncation)
                }
            }

            items.push({
                name,
                kind,
                source: loc,
                summary: docs,
                signature,
                params: tags.params,
                returns: tags.returns,
                examples: tags.examples,
            })
        }
    }

    return items.sort((a, b) => a.name.localeCompare(b.name))
}

function _toMarkdown(items) {
    const lines = [
        "# API Reference (Generated)",
        "",
        "Generated from public exports in `src/index.ts`.",
        "",
    ]

    for (const item of items) {
        lines.push(`## ${item.name}`)
        lines.push("")
        lines.push(`- Kind: \`${item.kind}\``)
        lines.push(`- Source: \`${item.source.file}:${item.source.line}:${item.source.column}\``)
        if (item.signature) lines.push(`- Signature: \`${item.signature}\``)
        lines.push("")

        if (item.summary) {
            lines.push(item.summary)
            lines.push("")
        }

        if (item.params.length > 0) {
            lines.push("Parameters:")
            for (const p of item.params) {
                lines.push(`- \`${p.name}\`: ${p.description || "(no description)"}`)
            }
            lines.push("")
        }

        if (item.returns) {
            lines.push(`Returns: ${item.returns}`)
            lines.push("")
        }

        if (item.examples.length > 0) {
            lines.push("Examples:")
            for (const example of item.examples) {
                lines.push("```ts")
                lines.push(example.trim())
                lines.push("```")
            }
            lines.push("")
        }
    }

    return lines.join("\n")
}

function _main() {
    _ensureOutDir()

    const files = fs
        .readdirSync(_SRC_DIR)
        .filter((file) => file.endsWith(".ts"))
        .map((file) => path.join(_SRC_DIR, file))

    const runtimeFiles = fs
        .readdirSync(path.join(_SRC_DIR, "runtime"))
        .filter((file) => file.endsWith(".ts"))
        .map((file) => path.join(_SRC_DIR, "runtime", file))

    const program = ts.createProgram({
        rootNames: [_ENTRY, ...files, ...runtimeFiles],
        options: {
            target: ts.ScriptTarget.ES2020,
            module: ts.ModuleKind.ESNext,
            moduleResolution: ts.ModuleResolutionKind.Bundler,
            skipLibCheck: true,
        },
    })

    const checker = program.getTypeChecker()
    const items = _parsePublicExports(program, checker)

    const payload = {
        generatedAt: new Date().toISOString(),
        package: "@remcostoeten/use-shortcut",
        sourceEntry: "src/index.ts",
        count: items.length,
        items,
    }

    fs.writeFileSync(_OUT_JSON, `${JSON.stringify(payload, null, 2)}\n`)
    fs.writeFileSync(_OUT_MD, `${_toMarkdown(items)}\n`)

    console.log(`Generated ${items.length} API items:`)
    console.log(`- ${path.relative(_ROOT, _OUT_JSON)}`)
    console.log(`- ${path.relative(_ROOT, _OUT_MD)}`)
}

_main()
