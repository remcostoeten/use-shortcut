import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { _getArchitectureTemplates, type ScaffoldFramework } from "./templates"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const _COLORS = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
    dim: "\x1b[2m",
    red: "\x1b[31m",
}

function _log(message: string, color = _COLORS.reset) {
    console.log(`${color}${message}${_COLORS.reset}`)
}

function _getSrcPath() {
    return join(__dirname, "..", "src")
}

function _getCopyDestPath(targetDir: string) {
    return join(process.cwd(), targetDir, "use-shortcut")
}

function _getScaffoldDestPath(targetDir: string, dir: string) {
    return join(process.cwd(), targetDir, dir)
}

function _getFlagValue(args: string[], flag: string, fallback: string): string {
    const flagIndex = args.indexOf(flag)
    if (flagIndex === -1) return fallback

    const value = args[flagIndex + 1]
    if (!value || value.startsWith("--")) return fallback

    return value
}

function _hasFlag(args: string[], flag: string): boolean {
    return args.includes(flag)
}

const _CORE_FILES = [
    "index.ts",
    "hook.ts",
    "builder.ts",
    "types.ts",
    "parser.ts",
    "constants.ts",
    "formatter.ts",
    "runtime/types.ts",
    "runtime/binding.ts",
    "runtime/conflicts.ts",
    "runtime/debug.ts",
    "runtime/guards.ts",
    "runtime/keys.ts",
    "runtime/listener.ts",
    "runtime/recording.ts",
]

function _init(targetDir = "hooks", force = false) {
    const srcPath = _getSrcPath()
    const destPath = _getCopyDestPath(targetDir)

    _log("\nuse-shortcut CLI\n", _COLORS.cyan)

    if (existsSync(destPath) && !force) {
        _log(`Directory already exists: ${destPath}`, _COLORS.yellow)
        _log("Use --force to overwrite existing files\n", _COLORS.dim)
        return
    }

    mkdirSync(destPath, { recursive: true })

    let written = 0

    for (const file of _CORE_FILES) {
        const srcFile = join(srcPath, file)
        const destFile = join(destPath, file)
        mkdirSync(dirname(destFile), { recursive: true })

        if (!existsSync(srcFile)) {
            _log(`Source file not found: ${file}`, _COLORS.yellow)
            continue
        }

        const content = readFileSync(srcFile, "utf-8")
        writeFileSync(destFile, content)
        written += 1
        _log(`  wrote ${file}`, _COLORS.green)
    }

    _log(`\nCopied ${written} files to:`, _COLORS.green)
    _log(`  ${destPath}\n`, _COLORS.dim)

    _log("Usage:", _COLORS.cyan)
    _log(`  import { useShortcut } from "@/${targetDir}/use-shortcut"`, _COLORS.dim)
    _log("  const $ = useShortcut()", _COLORS.dim)
    _log("  $.mod.key(\"k\").on(() => console.log(\"Search\"))\n", _COLORS.dim)
}

function _scaffoldArchitecture(
    framework: ScaffoldFramework,
    targetDir = "src",
    dir = "shortcuts",
    force = false,
) {
    const destPath = _getScaffoldDestPath(targetDir, dir)
    const templates = _getArchitectureTemplates(framework)

    _log("\nuse-shortcut CLI\n", _COLORS.cyan)
    _log(`Scaffolding ${framework} architecture in ${destPath}\n`, _COLORS.dim)

    mkdirSync(destPath, { recursive: true })

    let written = 0
    let skipped = 0

    for (const [file, content] of Object.entries(templates)) {
        const outputPath = join(destPath, file)

        if (existsSync(outputPath) && !force) {
            skipped += 1
            _log(`  skipped ${file} (already exists)`, _COLORS.yellow)
            continue
        }

        writeFileSync(outputPath, content)
        written += 1
        _log(`  wrote ${file}`, _COLORS.green)
    }

    _log("", _COLORS.reset)
    _log(`Architecture scaffold complete: ${written} written, ${skipped} skipped.`, _COLORS.green)
    _log(`Location: ${destPath}\n`, _COLORS.dim)

    _log("Next steps:", _COLORS.cyan)
    _log(`  1. Open ${join(targetDir, dir, "registry.ts")} and define your action catalog`, _COLORS.dim)
    _log(`  2. Wire app handlers into <ShortcutProvider handlers={...} />`, _COLORS.dim)
    _log(`  3. Toggle scopes from feature boundaries via useShortcutManager()`, _COLORS.dim)
    _log(`  4. Optionally expose setBinding/resetBinding in your settings UI\n`, _COLORS.dim)
}

function _printHelp() {
    _log("\nuse-shortcut CLI\n", _COLORS.cyan)
    _log("Commands:", _COLORS.yellow)
    _log("  init [--target hooks] [--force]", _COLORS.dim)
    _log("      Copy source files into your project (shadcn-style).", _COLORS.dim)
    _log("", _COLORS.dim)
    _log("  scaffold [--framework next|react] [--target src] [--dir shortcuts] [--force]", _COLORS.dim)
    _log("      Generate a scalable app shortcut architecture.", _COLORS.dim)
    _log("", _COLORS.dim)
    _log("  init --architecture", _COLORS.dim)
    _log("      Alias for scaffold with defaults.\n", _COLORS.dim)
}

function _parseFramework(value: string): ScaffoldFramework {
    if (value === "next" || value === "react") {
        return value
    }

    _log(`Invalid framework: ${value}. Expected \"next\" or \"react\".`, _COLORS.red)
    process.exit(1)
}

function _main() {
    const args = process.argv.slice(2)
    const command = args[0]

    const isHelp = !command || command === "--help" || command === "-h" || command === "help"

    if (isHelp) {
        _printHelp()
        return
    }

    if (command === "init") {
        if (_hasFlag(args, "--architecture") || _hasFlag(args, "--app") || _hasFlag(args, "--scaffold")) {
            const framework = _parseFramework(_getFlagValue(args, "--framework", "next"))
            const targetDir = _getFlagValue(args, "--target", "src")
            const dir = _getFlagValue(args, "--dir", "shortcuts")
            const force = _hasFlag(args, "--force")
            _scaffoldArchitecture(framework, targetDir, dir, force)
            return
        }

        const targetDir = _getFlagValue(args, "--target", "hooks")
        const force = _hasFlag(args, "--force")
        _init(targetDir, force)
        return
    }

    if (command === "scaffold" || command === "architecture") {
        const framework = _parseFramework(_getFlagValue(args, "--framework", "next"))
        const targetDir = _getFlagValue(args, "--target", "src")
        const dir = _getFlagValue(args, "--dir", "shortcuts")
        const force = _hasFlag(args, "--force")
        _scaffoldArchitecture(framework, targetDir, dir, force)
        return
    }

    _printHelp()
    process.exit(1)
}

_main()
