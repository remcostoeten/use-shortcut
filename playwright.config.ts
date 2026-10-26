import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
    testDir: "e2e",
    workers: 2,
    fullyParallel: true,
    reporter: "list",
    use: { baseURL: "http://localhost:4173" },
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
    webServer: {
        command: "bun run e2e/serve.ts",
        url: "http://localhost:4173",
        reuseExistingServer: false,
    },
})
