// @vitest-environment node

import { describe, expect, it } from "vitest"
import { _getArchitectureTemplates } from "./templates"

describe("architecture scaffold templates", () => {
    it("returns the full template set", () => {
        const templates = _getArchitectureTemplates("next")

        expect(Object.keys(templates).sort()).toEqual([
            "README.md",
            "index.ts",
            "provider.tsx",
            "registry.ts",
            "runtime.ts",
            "scopes.ts",
            "storage.ts",
            "types.ts",
        ])
    })

    it("includes lifecycle-safe registration cleanup in provider", () => {
        const templates = _getArchitectureTemplates("next")
        const provider = templates["provider.tsx"]

        expect(provider).toContain("registerShortcutMap")
        expect(provider).toContain("result.unbind()")
    })

    it("contains framework-specific integration guidance", () => {
        const nextReadme = _getArchitectureTemplates("next")["README.md"]
        const reactReadme = _getArchitectureTemplates("react")["README.md"]

        expect(nextReadme).toContain("Next.js Integration")
        expect(nextReadme).toContain("app/layout.tsx")

        expect(reactReadme).toContain("React Integration")
        expect(reactReadme).toContain("main.tsx")
    })
})
