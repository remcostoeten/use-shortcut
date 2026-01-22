#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const COLORS = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
    dim: "\x1b[2m",
}

function log(message: string, color = COLORS.reset) {
    console.log(`${color}${message}${COLORS.reset}`)
}

function getSrcPath() {
    return join(__dirname, "..", "src")
}

function getDestPath(targetDir: string) {
    return join(process.cwd(), targetDir, "use-shortcut")
}

const FILES = [
    "index.ts",
    "hook.ts",
    "builder.ts",
    "types.ts",
    "parser.ts",
    "constants.ts",
    "formatter.ts",
]

function init(targetDir = "hooks") {
    const srcPath = getSrcPath()
    const destPath = getDestPath(targetDir)

    log("\n🎹 use-shortcut CLI\n", COLORS.cyan)

    if (existsSync(destPath)) {
        log(`⚠️  Directory already exists: ${destPath}`, COLORS.yellow)
        log("   Use --force to overwrite\n")
        return
    }

    mkdirSync(destPath, { recursive: true })

    for (const file of FILES) {
        const srcFile = join(srcPath, file)
        const destFile = join(destPath, file)

        if (!existsSync(srcFile)) {
            log(`⚠️  Source file not found: ${file}`, COLORS.yellow)
            continue
        }

        let content = readFileSync(srcFile, "utf-8")

        content = content.replace(/"use client"\n\n/, "\"use client\"\n\n")

        writeFileSync(destFile, content)
        log(`  ✓ ${file}`, COLORS.green)
    }

    log("\n✨ Done! Files copied to:", COLORS.green)
    log(`   ${destPath}\n`, COLORS.dim)

    log("Usage:", COLORS.cyan)
    log(`  import { useShortcut } from "@/${targetDir}/use-shortcut"\n`, COLORS.dim)

    log("  const $ = useShortcut()", COLORS.dim)
    log("  $.mod.key(\"k\").on(() => console.log(\"Search!\"))\n", COLORS.dim)
}

function main() {
    const args = process.argv.slice(2)
    const command = args[0]

    if (command === "init") {
        const targetIndex = args.indexOf("--target")
        const targetDir = targetIndex !== -1 ? args[targetIndex + 1] : "hooks"
        init(targetDir)
    } else {
        log("\n🎹 use-shortcut CLI\n", COLORS.cyan)
        log("Commands:", COLORS.yellow)
        log("  init              Copy files to your project")
        log("  init --target lib Copy to custom directory\n")
    }
}

main()
