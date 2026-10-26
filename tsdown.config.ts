import { defineConfig } from "tsdown"

export default defineConfig({
    entry: { index: "src/index.ts", react: "src/react/index.ts" },
    format: "esm",
    dts: true,
    clean: true,
    fixedExtension: false,
    external: ["react", "react-dom", "react/jsx-runtime"],
})
