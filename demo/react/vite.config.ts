import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@remcostoeten/use-shortcut/react": fileURLToPath(
                new URL("../../src/react/index.ts", import.meta.url),
            ),
            "@remcostoeten/use-shortcut": fileURLToPath(
                new URL("../../src/index.ts", import.meta.url),
            ),
        },
    },
})
