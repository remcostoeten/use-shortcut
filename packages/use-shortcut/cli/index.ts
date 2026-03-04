import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { _getArchitectureTemplates, type ScaffoldFramework } from "./templates"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const COLORS = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
    dim: "\x1b[2m",
    red: "\x1b[31m",
}

function log(message: string, color = COLORS.reset) {
    console.log(`${color}${message}${COLORS.reset}`)
}

function getSrcPath() {
    return join(__dirname, "..", "src")
}

function getCopyDestPath(targetDir: string) {
    return join(process.cwd(), targetDir, "use-shortcut")
}

function getScaffoldDestPath(targetDir: string, dir: string) {
    return join(process.cwd(), targetDir, dir)
}

function getFlagValue(args: string[], flag: string, fallback: string): string {
    const flagIndex = args.indexOf(flag)
    if (flagIndex === -1) return fallback

    const value = args[flagIndex + 1]
    if (!value || value.startsWith("--")) return fallback

    return value
}

function hasFlag(args: string[], flag: string): boolean {
    return args.includes(flag)
}

const CORE_FILES = [
    "index.ts",
    "hook.ts",
    "builder.ts",
    "types.ts",
    "parser.ts",
    "constants.ts",
    "formatter.ts",
]

function init(targetDir = "hooks", force = false) {
    const srcPath = getSrcPath()
    const destPath = getCopyDestPath(targetDir)

    log("\nuse-shortcut CLI\n", COLORS.cyan)

    if (existsSync(destPath) && !force) {
        log(`Directory already exists: ${destPath}`, COLORS.yellow)
        log("Use --force to overwrite existing files\n", COLORS.dim)
        return
    }

    mkdirSync(destPath, { recursive: true })

    let written = 0

    for (const file of CORE_FILES) {
        const srcFile = join(srcPath, file)
        const destFile = join(destPath, file)

        if (!existsSync(srcFile)) {
            log(`Source file not found: ${file}`, COLORS.yellow)
            continue
        }

        const content = readFileSync(srcFile, "utf-8")
        writeFileSync(destFile, content)
        written += 1
        log(`  wrote ${file}`, COLORS.green)
    }

    log(`\nCopied ${written} files to:`, COLORS.green)
    log(`  ${destPath}\n`, COLORS.dim)

    log("Usage:", COLORS.cyan)
    log(`  import { useShortcut } from "@/${targetDir}/use-shortcut"`, COLORS.dim)
    log("  const $ = useShortcut()", COLORS.dim)
    log("  $.mod.key(\"k\").on(() => console.log(\"Search\"))\n", COLORS.dim)
}

function scaffoldArchitecture(
    framework: ScaffoldFramework,
    targetDir = "src",
    dir = "shortcuts",
    force = false,
) {
    const destPath = getScaffoldDestPath(targetDir, dir)
    const templates = _getArchitectureTemplates(framework)

    log("\nuse-shortcut CLI\n", COLORS.cyan)
    log(`Scaffolding ${framework} architecture in ${destPath}\n`, COLORS.dim)

    mkdirSync(destPath, { recursive: true })

    let written = 0
    let skipped = 0

    for (const [file, content] of Object.entries(templates)) {
        const outputPath = join(destPath, file)

        if (existsSync(outputPath) && !force) {
            skipped += 1
            log(`  skipped ${file} (already exists)`, COLORS.yellow)
            continue
        }

        writeFileSync(outputPath, content)
        written += 1
        log(`  wrote ${file}`, COLORS.green)
    }

    log("", COLORS.reset)
    log(`Architecture scaffold complete: ${written} written, ${skipped} skipped.`, COLORS.green)
    log(`Location: ${destPath}\n`, COLORS.dim)

    log("Next steps:", COLORS.cyan)
    log(`  1. Open ${join(targetDir, dir, "registry.ts")} and define your action catalog`, COLORS.dim)
    log(`  2. Wire app handlers into <ShortcutProvider handlers={...} />`, COLORS.dim)
    log(`  3. Toggle scopes from feature boundaries via useShortcutManager()`, COLORS.dim)
    log(`  4. Optionally expose setBinding/resetBinding in your settings UI\n`, COLORS.dim)
}

function printHelp() {
    log("\nuse-shortcut CLI\n", COLORS.cyan)
    log("Commands:", COLORS.yellow)
    log("  init [--target hooks] [--force]", COLORS.dim)
    log("      Copy source files into your project (shadcn-style).", COLORS.dim)
    log("", COLORS.dim)
    log("  scaffold [--framework next|react] [--target src] [--dir shortcuts] [--force]", COLORS.dim)
    log("      Generate a scalable app shortcut architecture.", COLORS.dim)
    log("", COLORS.dim)
    log("  init --architecture", COLORS.dim)
    log("      Alias for scaffold with defaults.\n", COLORS.dim)
}

function parseFramework(value: string): ScaffoldFramework {
    if (value === "next" || value === "react") {
        return value
    }

    log(`Invalid framework: ${value}. Expected \"next\" or \"react\".`, COLORS.red)
    process.exit(1)
}

function main() {
    const args = process.argv.slice(2)
    const command = args[0]

    const isHelp = !command || command === "--help" || command === "-h" || command === "help"

    if (isHelp) {
        printHelp()
        return
    }

    if (command === "init") {
        if (hasFlag(args, "--architecture") || hasFlag(args, "--app") || hasFlag(args, "--scaffold")) {
            const framework = parseFramework(getFlagValue(args, "--framework", "next"))
            const targetDir = getFlagValue(args, "--target", "src")
            const dir = getFlagValue(args, "--dir", "shortcuts")
            const force = hasFlag(args, "--force")
            scaffoldArchitecture(framework, targetDir, dir, force)
            return
        }

        const targetDir = getFlagValue(args, "--target", "hooks")
        const force = hasFlag(args, "--force")
        init(targetDir, force)
        return
    }

    if (command === "scaffold" || command === "architecture") {
        const framework = parseFramework(getFlagValue(args, "--framework", "next"))
        const targetDir = getFlagValue(args, "--target", "src")
        const dir = getFlagValue(args, "--dir", "shortcuts")
        const force = hasFlag(args, "--force")
        scaffoldArchitecture(framework, targetDir, dir, force)
        return
    }

    printHelp()
    process.exit(1)
}

main()
