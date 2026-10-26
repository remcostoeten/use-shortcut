import { $ } from "bun"

type Bump = "patch" | "minor" | "major" | "prerelease"

function fail(message: string): never {
    console.error(message)
    process.exit(1)
}

function parse(version: string) {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-z]+)\.(\d+))?$/)
    if (!match) fail(`"${version}" is not a version like 1.2.3 or 1.2.3-beta.4`)
    const [, major, minor, patch, label, number] = match
    return {
        major: Number(major),
        minor: Number(minor),
        patch: Number(patch),
        label: label ?? null,
        number: number === undefined ? null : Number(number),
    }
}

function compare(left: string, right: string) {
    const a = parse(left)
    const b = parse(right)
    const core = a.major - b.major || a.minor - b.minor || a.patch - b.patch
    if (core !== 0) return core
    if (a.label === null && b.label === null) return 0
    if (a.label === null) return 1
    if (b.label === null) return -1
    return (a.number ?? 0) - (b.number ?? 0)
}

function bump(current: string, kind: Bump) {
    const v = parse(current)
    if (kind === "prerelease") {
        if (v.label === null) fail(`${current} is not a prerelease; pass an explicit version`)
        return `${v.major}.${v.minor}.${v.patch}-${v.label}.${(v.number ?? 0) + 1}`
    }
    if (v.label !== null && kind === "patch") return `${v.major}.${v.minor}.${v.patch}`
    if (kind === "major") return `${v.major + 1}.0.0`
    if (kind === "minor") return `${v.major}.${v.minor + 1}.0`
    return `${v.major}.${v.minor}.${v.patch + 1}`
}

function isBump(value: string): value is Bump {
    return value === "patch" || value === "minor" || value === "major" || value === "prerelease"
}

async function resolveNext(current: string, argument: string | undefined) {
    if (argument === undefined) return bump(current, "patch")
    if (isBump(argument)) return bump(current, argument)
    parse(argument)
    return argument
}

async function assertClean() {
    const status = (await $`git status --porcelain`.text()).trim()
    if (status !== "") fail("the working tree is not clean")
}

async function assertTagFree(tag: string) {
    const local = (await $`git tag --list ${tag}`.text()).trim()
    if (local !== "") fail(`tag ${tag} already exists`)
    const remote = (await $`git ls-remote --tags origin ${tag}`.text()).trim()
    if (remote !== "") fail(`tag ${tag} already exists on origin`)
}

async function writeVersion(next: string) {
    const file = Bun.file("package.json")
    const manifest = await file.json()
    manifest.version = next
    await Bun.write(file, `${JSON.stringify(manifest, null, 4)}\n`)
}

async function dateChangelog(next: string) {
    const file = Bun.file("CHANGELOG.md")
    const text = await file.text()
    const heading = `## [${next}] - Unreleased`
    if (!text.includes(heading)) fail(`CHANGELOG.md has no "${heading}" section`)
    const today = new Date().toISOString().slice(0, 10)
    await Bun.write(file, text.replace(heading, `## [${next}] - ${today}`))
}

async function release() {
    const current: string = (await Bun.file("package.json").json()).version
    const next = await resolveNext(current, process.argv[2])
    if (compare(next, current) <= 0) fail(`${next} is not higher than ${current}`)
    const tag = `v${next}`
    const branch = (await $`git branch --show-current`.text()).trim()

    await assertClean()
    await assertTagFree(tag)

    console.log(`${current} -> ${next} on ${branch}, tag ${tag}`)
    await $`bun run check`
    await writeVersion(next)
    await dateChangelog(next)
    await $`bun run format`
    await $`git add package.json CHANGELOG.md`
    await $`git commit -m ${`Release ${next}`}`
    await $`git tag ${tag}`
    await $`git push origin ${branch} ${tag}`
    console.log(`pushed ${tag}; the Release workflow publishes it`)
}

await release()
