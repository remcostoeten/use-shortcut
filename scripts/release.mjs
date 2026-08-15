import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import readline from "node:readline/promises"

const _ROOT = path.resolve(import.meta.dirname, "..")

/**
 * Every file carrying the package version. Each entry reads and writes the
 * version for one file, so adding a new carrier (a docs constant, a README
 * install pin) means adding one entry here and nothing else.
 */
const _VERSION_TARGETS = [
    {
        label: "packages/use-shortcut/package.json",
        file: path.join(_ROOT, "packages/use-shortcut/package.json"),
        read: (raw) => JSON.parse(raw).version,
        write: (raw, version) => raw.replace(/("version":\s*)"[^"]+"/, `$1"${version}"`),
    },
]

const _CHANGELOG = path.join(_ROOT, "packages/use-shortcut/CHANGELOG.md")
const _PACKAGE_DIR = path.join(_ROOT, "packages/use-shortcut")
const _PACKAGE_NAME = "@remcostoeten/use-shortcut"

const _BUMP_LEVELS = ["patch", "minor", "major"]

/**
 * Conventional-commit type → Keep a Changelog section. Types absent from this
 * map (chore, test, ci, build, style) are noise in a changelog; they still
 * appear in the release notes commit list.
 */
const _SECTION_BY_TYPE = {
    feat: "Added",
    fix: "Fixed",
    perf: "Changed",
    refactor: "Changed",
    revert: "Changed",
    docs: "Documentation",
}

const _SECTION_ORDER = ["Added", "Changed", "Fixed", "Removed", "Documentation"]

function _fail(message) {
    console.error(`release failed: ${message}`)
    process.exit(1)
}

function _git(args, options = {}) {
    return execFileSync("git", args, { cwd: _ROOT, encoding: "utf8", ...options }).trim()
}

function _run(command, args, options = {}) {
    execFileSync(command, args, { cwd: _ROOT, stdio: "inherit", ...options })
}

function _parseVersion(value) {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value.trim())
    if (!match) return null
    return {
        major: Number(match[1]),
        minor: Number(match[2]),
        patch: Number(match[3]),
    }
}

function _compareVersions(a, b) {
    if (a.major !== b.major) return a.major - b.major
    if (a.minor !== b.minor) return a.minor - b.minor
    return a.patch - b.patch
}

function _formatVersion({ major, minor, patch }) {
    return `${major}.${minor}.${patch}`
}

function _bumpVersion(current, level) {
    if (level === "major") return { major: current.major + 1, minor: 0, patch: 0 }
    if (level === "minor") return { major: current.major, minor: current.minor + 1, patch: 0 }
    return { major: current.major, minor: current.minor, patch: current.patch + 1 }
}

function _parseArgs(argv) {
    const options = {
        target: null,
        dryRun: false,
        publish: true,
        push: true,
        githubRelease: true,
        verify: true,
        yes: false,
    }

    for (const arg of argv) {
        if (arg === "--dry-run") options.dryRun = true
        else if (arg === "--no-publish") options.publish = false
        else if (arg === "--no-push") options.push = false
        else if (arg === "--no-github-release") options.githubRelease = false
        else if (arg === "--no-verify") options.verify = false
        else if (arg === "--yes" || arg === "-y") options.yes = true
        else if (arg.startsWith("-")) _fail(`unknown flag: ${arg}`)
        else if (options.target) _fail(`unexpected argument: ${arg}`)
        else options.target = arg
    }

    return options
}

function _resolveNextVersion(currentRaw, target) {
    const current = _parseVersion(currentRaw)
    if (!current) _fail(`current version is not semver: "${currentRaw}"`)

    if (!target || _BUMP_LEVELS.includes(target)) {
        return _bumpVersion(current, target ?? "patch")
    }

    const explicit = _parseVersion(target)
    if (!explicit) {
        _fail(`"${target}" is neither a bump level (${_BUMP_LEVELS.join(", ")}) nor an x.y.z version`)
    }

    if (_compareVersions(explicit, current) <= 0) {
        _fail(`${_formatVersion(explicit)} is not higher than the current ${currentRaw}`)
    }

    return explicit
}

function _readCurrentVersion() {
    const versions = _VERSION_TARGETS.map((target) => ({
        label: target.label,
        version: target.read(fs.readFileSync(target.file, "utf8")),
    }))

    const distinct = [...new Set(versions.map((entry) => entry.version))]
    if (distinct.length > 1) {
        const detail = versions.map((entry) => `${entry.label}=${entry.version}`).join(", ")
        _fail(`version targets disagree before bumping (${detail})`)
    }

    return distinct[0]
}

function _writeVersion(version, dryRun) {
    for (const target of _VERSION_TARGETS) {
        const raw = fs.readFileSync(target.file, "utf8")
        const next = target.write(raw, version)

        if (target.read(next) !== version) {
            _fail(`could not set the version in ${target.label}`)
        }

        if (!dryRun) fs.writeFileSync(target.file, next)
        console.log(`  ${dryRun ? "would update" : "updated"} ${target.label}`)
    }
}

function _lastTag() {
    try {
        return _git(["describe", "--tags", "--abbrev=0"], { stdio: ["pipe", "pipe", "ignore"] })
    } catch {
        return null
    }
}

/**
 * Commits since `sinceTag` that actually touched the published package.
 * Repo-level work — docs site, release tooling, CI — must not show up in the
 * package's changelog, and must not on its own justify a release.
 */
function _collectCommits(sinceTag) {
    const range = sinceTag ? `${sinceTag}..HEAD` : "HEAD"
    const raw = _git([
        "log",
        range,
        "--no-merges",
        "--pretty=%H%x1f%s%x1f%b%x1e",
        "--",
        "packages/use-shortcut",
    ])
    if (!raw) return []

    return raw
        .split("\x1e")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
            const [hash, subject, body] = entry.split("\x1f")
            return { hash, subject, body: body ?? "" }
        })
}

function _classifyCommit(commit) {
    const match = /^(\w+)(\([^)]*\))?(!)?:\s*(.+)$/.exec(commit.subject)

    if (!match) {
        return { type: null, breaking: false, description: commit.subject, section: null }
    }

    const [, type, , bang, description] = match
    const breaking = Boolean(bang) || /^BREAKING CHANGE:/m.test(commit.body)

    return {
        type,
        breaking,
        description,
        section: breaking ? "Changed" : (_SECTION_BY_TYPE[type] ?? null),
    }
}

function _groupCommits(commits) {
    const sections = new Map()
    const skipped = []

    for (const commit of commits) {
        const classified = _classifyCommit(commit)

        if (!classified.section) {
            skipped.push({ ...commit, ...classified })
            continue
        }

        const entries = sections.get(classified.section) ?? []
        const prefix = classified.breaking ? "**BREAKING** " : ""
        entries.push({ ...commit, ...classified, line: `${prefix}${classified.description}` })
        sections.set(classified.section, entries)
    }

    return { sections, skipped }
}

function _today() {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${now.getFullYear()}-${month}-${day}`
}

function _renderChangelogEntry(version, sections) {
    const lines = [`## [${version}] - ${_today()}`, ""]

    for (const section of _SECTION_ORDER) {
        const entries = sections.get(section)
        if (!entries || entries.length === 0) continue

        lines.push(`### ${section}`, "")
        for (const entry of entries) lines.push(`- ${entry.line}`)
        lines.push("")
    }

    return `${lines.join("\n")}\n`
}

function _insertChangelogEntry(entry, dryRun) {
    const raw = fs.readFileSync(_CHANGELOG, "utf8")
    const firstRelease = raw.indexOf("\n## [")

    if (firstRelease === -1) {
        _fail("CHANGELOG.md has no existing '## [x.y.z]' heading to insert before")
    }

    const next = `${raw.slice(0, firstRelease + 1)}${entry}${raw.slice(firstRelease + 1)}`
    if (!dryRun) fs.writeFileSync(_CHANGELOG, next)

    return entry
}

function _renderReleaseNotes(version, previousTag, sections, skipped) {
    const lines = [`## ${_PACKAGE_NAME} v${version}`, ""]

    for (const section of _SECTION_ORDER) {
        const entries = sections.get(section)
        if (!entries || entries.length === 0) continue

        lines.push(`### ${section}`, "")
        for (const entry of entries) {
            lines.push(`- ${entry.line} (${entry.hash.slice(0, 7)})`)
        }
        lines.push("")
    }

    if (skipped.length > 0) {
        lines.push("<details><summary>Other commits</summary>", "")
        for (const commit of skipped) {
            lines.push(`- ${commit.subject} (${commit.hash.slice(0, 7)})`)
        }
        lines.push("", "</details>", "")
    }

    lines.push("### Install", "", "```sh", `npm install ${_PACKAGE_NAME}@${version}`, "```", "")

    const repo = "https://github.com/remcostoeten/use-shortcut"
    if (previousTag) {
        lines.push(`**Full changelog**: ${repo}/compare/${previousTag}...v${version}`)
    }

    return lines.join("\n")
}

async function _confirm(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const answer = await rl.question(`${question} [y/N] `)
    rl.close()
    return answer.trim().toLowerCase() === "y"
}

function _ensureReleasable(version, options) {
    const branch = _git(["rev-parse", "--abbrev-ref", "HEAD"])
    if (branch !== "master") {
        _fail(`releases run from master, not ${branch}`)
    }

    if (_git(["status", "--porcelain"])) {
        _fail("working tree is dirty; commit or stash first")
    }

    const tag = `v${version}`
    const existing = _git(["tag", "-l", tag])
    if (existing) _fail(`tag ${tag} already exists`)

    if (options.publish) {
        try {
            const published = execFileSync("npm", ["view", `${_PACKAGE_NAME}@${version}`, "version"], {
                encoding: "utf8",
                stdio: ["pipe", "pipe", "ignore"],
            }).trim()

            if (published) _fail(`${version} is already published to npm`)
        } catch {
            // `npm view` exits non-zero when the version does not exist, which is what we want.
        }
    }
}

async function main() {
    const options = _parseArgs(process.argv.slice(2))
    const currentVersion = _readCurrentVersion()
    const version = _formatVersion(_resolveNextVersion(currentVersion, options.target))
    const tag = `v${version}`

    if (!options.dryRun) _ensureReleasable(version, options)

    const previousTag = _lastTag()
    const commits = _collectCommits(previousTag)

    if (commits.length === 0) {
        _fail(
            `no commits touching packages/use-shortcut since ${previousTag ?? "the beginning of history"};` +
                " there is nothing to release",
        )
    }

    const { sections, skipped } = _groupCommits(commits)
    const breaking = [...sections.values()].flat().filter((entry) => entry.breaking)

    console.log(`\n${currentVersion} → ${version}  (${options.target ?? "patch"})`)
    console.log(`${commits.length} commit(s) since ${previousTag ?? "the beginning of history"}\n`)

    if (breaking.length > 0 && version.endsWith(".0.0") === false) {
        console.log(`  warning: ${breaking.length} breaking change(s) in a non-major release\n`)
    }

    const changelogEntry = _renderChangelogEntry(version, sections)
    const releaseNotes = _renderReleaseNotes(version, previousTag, sections, skipped)

    console.log("--- changelog entry ---")
    console.log(changelogEntry)
    console.log("--- release notes ---")
    console.log(releaseNotes)
    console.log("-----------------------\n")

    if (options.dryRun) {
        console.log("dry run: nothing written, committed, tagged, pushed, or published")
        _writeVersion(version, true)
        return
    }

    if (!options.yes && !(await _confirm(`Release ${tag}?`))) {
        console.log("aborted")
        process.exit(1)
    }

    _writeVersion(version, false)
    _insertChangelogEntry(changelogEntry, false)

    if (options.verify) {
        console.log("\nrunning package verify...")
        _run("bun", ["run", "verify"], { cwd: _PACKAGE_DIR })
    }

    const notesFile = path.join(_ROOT, `.release-notes-${tag}.md`)
    fs.writeFileSync(notesFile, releaseNotes)

    _git(["add", "-A"])
    _git(["commit", "-m", `chore: release ${tag}`])
    _git(["tag", "-a", tag, "-m", tag])

    if (options.push) {
        console.log(`\npushing master and ${tag}...`)
        _run("git", ["push", "origin", "master"])
        _run("git", ["push", "origin", tag])
    }

    if (options.publish) {
        console.log("\npublishing to npm...")
        _run("npm", ["publish"], { cwd: _PACKAGE_DIR })
    }

    if (options.githubRelease && options.push) {
        console.log("\ncreating the GitHub release...")
        try {
            _run("gh", ["release", "create", tag, "--title", tag, "--notes-file", notesFile])
        } catch {
            console.log(`  gh release failed; notes kept at ${path.relative(_ROOT, notesFile)}`)
        }
    }

    fs.rmSync(notesFile, { force: true })
    console.log(`\nreleased ${tag}`)
}

await main()
