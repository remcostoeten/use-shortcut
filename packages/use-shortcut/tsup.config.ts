import { defineConfig } from "tsup"

export default defineConfig({
    entry: [
        "src/index.ts",
        "src/react.ts",
        "src/parser.ts",
        "src/formatter.ts",
        "src/constants.ts",
    ],
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    sourcemap: false,
    clean: true,
    external: ["react"],
    treeshake: true,
    minify: true,
})
