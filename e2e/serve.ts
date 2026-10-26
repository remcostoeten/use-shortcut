import { join } from "node:path"

const root = join(import.meta.dir, "fixture")
const port = 4173

/**
 * @name buildFixture
 * @description Bundles the library entry into `e2e/fixture/dist/index.js` so the fixture page can
 * import it as a plain ES module.
 *
 * @example
 * await buildFixture()
 */
export async function buildFixture(): Promise<void> {
    const result = await Bun.build({
        entrypoints: [join(import.meta.dir, "..", "src", "index.ts")],
        outdir: join(root, "dist"),
        target: "browser",
        format: "esm",
    })
    if (!result.success) {
        throw new Error(result.logs.map((log) => log.message).join("\n"))
    }
}

/**
 * @name serveFixture
 * @description Serves the fixture directory on a fixed port for the Playwright suite.
 *
 * @example
 * const server = serveFixture()
 * server.stop()
 */
export function serveFixture() {
    return Bun.serve({
        port,
        fetch: async (request) => {
            const pathname = new URL(request.url).pathname
            const relative = pathname === "/" ? "index.html" : pathname.slice(1)
            const file = Bun.file(join(root, relative))
            if (!(await file.exists())) return new Response("Not found", { status: 404 })
            return new Response(file)
        },
    })
}

await buildFixture()
serveFixture()
