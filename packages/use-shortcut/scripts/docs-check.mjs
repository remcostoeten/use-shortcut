import fs from "fs"
import path from "path"

const _ROOT = process.cwd()
const _API_JSON = path.join(_ROOT, "docs-input", "api-reference.json")
const _PUBLIC_API_MD = path.join(_ROOT, "PUBLIC_API.md")

function _fail(message) {
    console.error(`docs:check failed: ${message}`)
    process.exit(1)
}

if (!fs.existsSync(_API_JSON)) {
    _fail("missing docs-input/api-reference.json (run `bun run docs:api` first)")
}

if (!fs.existsSync(_PUBLIC_API_MD)) {
    _fail("missing PUBLIC_API.md")
}

const api = JSON.parse(fs.readFileSync(_API_JSON, "utf8"))
const publicMd = fs.readFileSync(_PUBLIC_API_MD, "utf8")
const generatedApiMdPath = path.join(_ROOT, "docs-input", "api-reference.md")
const generatedApiMd = fs.existsSync(generatedApiMdPath) ? fs.readFileSync(generatedApiMdPath, "utf8") : ""

const publicNames = new Set(
    [...publicMd.matchAll(/- `([^`]+)`/g)].map((m) => m[1].replace(/\(.*\)$/, "").trim())
)

const missingSummary = api.items.filter((item) => (item.summary ?? "").trim().length === 0)
if (missingSummary.length > 0) {
    _fail(`missing JSDoc summary for: ${missingSummary.map((x) => x.name).join(", ")}`)
}

const missingInInventory = api.items.filter((item) => !publicNames.has(item.name))
if (missingInInventory.length > 0) {
    _fail(`PUBLIC_API.md missing: ${missingInInventory.map((x) => x.name).join(", ")}`)
}

if (/```[^\n]*\n```/.test(generatedApiMd)) {
    _fail("docs-input/api-reference.md contains nested or empty fenced code blocks")
}

console.log("docs:check passed")
console.log(`- verified ${api.items.length} public exports`) 
console.log("- all exports include summary docs")
console.log("- PUBLIC_API.md includes all generated symbols")
