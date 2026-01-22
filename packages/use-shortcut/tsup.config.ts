import { defineConfig } from "tsup"

export default defineConfig([
    {
        entry: ["src/index.ts"],
        format: ["cjs", "esm"],
        dts: true,
        splitting: false,
        sourcemap: true,
        clean: true,
        external: ["react"],
        treeshake: true,
        minify: false,
    },
    {
        entry: ["cli/index.ts"],
        outDir: "dist/cli",
        format: ["esm"],
        splitting: false,
        sourcemap: false,
        clean: false,
        banner: {
            js: "#!/usr/bin/env node",
        },
        platform: "node",
        target: "node18",
    },
])
