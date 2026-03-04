#!/usr/bin/env node

// cli/index.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// cli/templates.ts
function _getArchitectureTemplates(framework) {
  const integrationSection = framework === "next" ? `## Next.js Integration

1. Create a client provider wrapper at \`app/shortcut-provider.tsx\` and render \`<ShortcutProvider />\` there.
2. Render that provider inside \`app/layout.tsx\` around your app shell.
3. Keep page/server components pure; shortcut handlers stay in client components.
` : `## React Integration

1. Wrap your app root (for example in \`main.tsx\`) with \`<ShortcutProvider />\`.
2. Keep handlers in a top-level client component and pass them to the provider via \`handlers\`.
3. Use \`useShortcutManager()\` inside feature components to toggle scopes and bindings.
`;
  return {
    "scopes.ts": `export const shortcutScopes = ["global", "navigation", "editor", "modal"] as const

export type ShortcutScope = (typeof shortcutScopes)[number]

export const defaultActiveScopes: ShortcutScope[] = ["global", "navigation"]

export function normalizeScopes(scopes: ShortcutScope | ShortcutScope[]): ShortcutScope[] {
    return Array.isArray(scopes) ? scopes : [scopes]
}
`,
    "registry.ts": `import type { HandlerOptions } from "@remcostoeten/use-shortcut"
import type { ShortcutScope } from "./scopes"

export type ShortcutDefinition = {
    description: string
    defaultKeys: string | string[]
    scopes: ShortcutScope[]
    options?: Omit<HandlerOptions, "scopes">
}

export const shortcutRegistry = {
    openCommandPalette: {
        description: "Open global command palette",
        defaultKeys: "mod+k",
        scopes: ["global", "navigation"],
    },
    saveDocument: {
        description: "Save the active editor document",
        defaultKeys: "mod+s",
        scopes: ["editor"],
    },
    goDashboard: {
        description: "Navigate to dashboard (vim style sequence)",
        defaultKeys: ["g", "d"],
        scopes: ["navigation"],
    },
    closeOverlay: {
        description: "Close active overlay",
        defaultKeys: "escape",
        scopes: ["global", "modal"],
    },
} as const satisfies Record<string, ShortcutDefinition>

export type ShortcutActionId = keyof typeof shortcutRegistry
export type ShortcutBindings = Record<ShortcutActionId, string | string[]>
`,
    "types.ts": `import type { ShortcutActionId, ShortcutBindings } from "./registry"
import type { ShortcutScope } from "./scopes"

export type ShortcutHandlers = Record<ShortcutActionId, (event: KeyboardEvent) => void>

export type ShortcutState = {
    activeScopes: ShortcutScope[]
    bindings: ShortcutBindings
    enabled: boolean
}

export type ShortcutActions = {
    setScopes: (scopes: ShortcutScope | ShortcutScope[]) => void
    enableScope: (scope: ShortcutScope) => void
    disableScope: (scope: ShortcutScope) => void
    setBinding: (actionId: ShortcutActionId, keys: string | string[]) => void
    resetBinding: (actionId: ShortcutActionId) => void
    resetBindings: () => void
    setEnabled: (enabled: boolean) => void
}

export type ShortcutMeta = {
    hasBindingOverrides: boolean
    availableActions: ShortcutActionId[]
}

export type ShortcutContextValue = {
    state: ShortcutState
    actions: ShortcutActions
    meta: ShortcutMeta
}
`,
    "runtime.ts": `import type { ShortcutMap } from "@remcostoeten/use-shortcut"
import { shortcutRegistry, type ShortcutActionId, type ShortcutBindings } from "./registry"
import type { ShortcutHandlers } from "./types"

export function createDefaultBindings(): ShortcutBindings {
    const bindings = {} as ShortcutBindings

    for (const actionId of Object.keys(shortcutRegistry) as ShortcutActionId[]) {
        bindings[actionId] = shortcutRegistry[actionId].defaultKeys
    }

    return bindings
}

export function createShortcutMap(bindings: ShortcutBindings, handlers: ShortcutHandlers): ShortcutMap {
    const map: ShortcutMap = {}

    for (const actionId of Object.keys(shortcutRegistry) as ShortcutActionId[]) {
        const definition = shortcutRegistry[actionId]
        const handler = handlers[actionId]

        if (!handler) {
            continue
        }

        map[actionId] = {
            keys: bindings[actionId],
            handler,
            options: {
                ...definition.options,
                scopes: definition.scopes,
                description: definition.description,
            },
        }
    }

    return map
}
`,
    "storage.ts": `import type { ShortcutActionId, ShortcutBindings } from "./registry"

export const DEFAULT_SHORTCUT_STORAGE_KEY = "app-shortcut-bindings"

function isBindingValue(value: unknown): value is string | string[] {
    if (typeof value === "string") return true
    return Array.isArray(value) && value.every((entry) => typeof entry === "string")
}

export function loadShortcutBindings(storageKey: string): Partial<ShortcutBindings> {
    if (typeof window === "undefined") return {}

    try {
        const raw = window.localStorage.getItem(storageKey)
        if (!raw) return {}

        const parsed = JSON.parse(raw) as unknown
        if (!parsed || typeof parsed !== "object") return {}

        const result: Partial<ShortcutBindings> = {}

        for (const [actionId, value] of Object.entries(parsed as Record<string, unknown>)) {
            if (!isBindingValue(value)) continue
            result[actionId as ShortcutActionId] = value
        }

        return result
    } catch {
        return {}
    }
}

export function saveShortcutBindings(storageKey: string, bindings: ShortcutBindings): void {
    if (typeof window === "undefined") return

    try {
        window.localStorage.setItem(storageKey, JSON.stringify(bindings))
    } catch {
        // Ignore quota/security errors.
    }
}

export function clearShortcutBindings(storageKey: string): void {
    if (typeof window === "undefined") return

    try {
        window.localStorage.removeItem(storageKey)
    } catch {
        // Ignore quota/security errors.
    }
}
`,
    "provider.tsx": `"use client"

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react"
import { registerShortcutMap, useShortcut, type UseShortcutOptions } from "@remcostoeten/use-shortcut"
import { shortcutRegistry, type ShortcutActionId, type ShortcutBindings } from "./registry"
import { createDefaultBindings, createShortcutMap } from "./runtime"
import { defaultActiveScopes, normalizeScopes, type ShortcutScope } from "./scopes"
import {
    DEFAULT_SHORTCUT_STORAGE_KEY,
    clearShortcutBindings,
    loadShortcutBindings,
    saveShortcutBindings,
} from "./storage"
import type { ShortcutContextValue, ShortcutHandlers } from "./types"

const ShortcutContext = createContext<ShortcutContextValue | null>(null)

function mergeBindings(defaultBindings: ShortcutBindings, persisted: Partial<ShortcutBindings>): ShortcutBindings {
    const merged = { ...defaultBindings }

    for (const actionId of Object.keys(defaultBindings) as ShortcutActionId[]) {
        const value = persisted[actionId]
        if (typeof value === "string" || Array.isArray(value)) {
            merged[actionId] = value
        }
    }

    return merged
}

function sameBinding(a: string | string[], b: string | string[]): boolean {
    const left = Array.isArray(a) ? a.join("|") : a
    const right = Array.isArray(b) ? b.join("|") : b
    return left === right
}

function hasBindingOverrides(bindings: ShortcutBindings): boolean {
    const defaults = createDefaultBindings()

    for (const actionId of Object.keys(defaults) as ShortcutActionId[]) {
        if (!sameBinding(bindings[actionId], defaults[actionId])) {
            return true
        }
    }

    return false
}

export type ShortcutProviderProps = {
    children: ReactNode
    handlers: ShortcutHandlers
    initialScopes?: ShortcutScope[]
    initialEnabled?: boolean
    persistBindings?: boolean
    storageKey?: string
    shortcutOptions?: Omit<UseShortcutOptions, "activeScopes" | "disabled">
}

export function ShortcutProvider({
    children,
    handlers,
    initialScopes = defaultActiveScopes,
    initialEnabled = true,
    persistBindings = true,
    storageKey = DEFAULT_SHORTCUT_STORAGE_KEY,
    shortcutOptions,
}: ShortcutProviderProps) {
    const [activeScopes, setActiveScopes] = useState<ShortcutScope[]>(initialScopes)
    const [enabled, setEnabled] = useState(initialEnabled)
    const [bindings, setBindings] = useState<ShortcutBindings>(() => createDefaultBindings())

    useEffect(() => {
        setEnabled(initialEnabled)
    }, [initialEnabled])

    useEffect(() => {
        if (!persistBindings) return

        const persisted = loadShortcutBindings(storageKey)
        setBindings((current) => mergeBindings(current, persisted))
    }, [persistBindings, storageKey])

    useEffect(() => {
        if (!persistBindings) return
        saveShortcutBindings(storageKey, bindings)
    }, [bindings, persistBindings, storageKey])

    const shortcutMap = useMemo(() => createShortcutMap(bindings, handlers), [bindings, handlers])

    const $ = useShortcut({
        ...shortcutOptions,
        activeScopes,
        disabled: !enabled,
    })

    useEffect(() => {
        const registrations = registerShortcutMap($, shortcutMap)

        return () => {
            for (const result of Object.values(registrations)) {
                result.unbind()
            }
        }
    }, [$, shortcutMap])

    const setScopes = useCallback((scopes: ShortcutScope | ShortcutScope[]) => {
        setActiveScopes(normalizeScopes(scopes))
    }, [])

    const enableScope = useCallback((scope: ShortcutScope) => {
        setActiveScopes((current) => {
            if (current.includes(scope)) return current
            return [...current, scope]
        })
    }, [])

    const disableScope = useCallback((scope: ShortcutScope) => {
        setActiveScopes((current) => current.filter((item) => item !== scope))
    }, [])

    const setBinding = useCallback((actionId: ShortcutActionId, keys: string | string[]) => {
        setBindings((current) => ({
            ...current,
            [actionId]: keys,
        }))
    }, [])

    const resetBinding = useCallback((actionId: ShortcutActionId) => {
        setBindings((current) => ({
            ...current,
            [actionId]: shortcutRegistry[actionId].defaultKeys,
        }))
    }, [])

    const resetBindings = useCallback(() => {
        setBindings(createDefaultBindings())
        if (persistBindings) clearShortcutBindings(storageKey)
    }, [persistBindings, storageKey])

    const contextValue = useMemo<ShortcutContextValue>(
        () => ({
            state: {
                activeScopes,
                bindings,
                enabled,
            },
            actions: {
                setScopes,
                enableScope,
                disableScope,
                setBinding,
                resetBinding,
                resetBindings,
                setEnabled,
            },
            meta: {
                hasBindingOverrides: hasBindingOverrides(bindings),
                availableActions: Object.keys(shortcutRegistry) as ShortcutActionId[],
            },
        }),
        [
            activeScopes,
            bindings,
            enabled,
            setScopes,
            enableScope,
            disableScope,
            setBinding,
            resetBinding,
            resetBindings,
        ],
    )

    return <ShortcutContext.Provider value={contextValue}>{children}</ShortcutContext.Provider>
}

export function useShortcutManager(): ShortcutContextValue {
    const context = useContext(ShortcutContext)

    if (!context) {
        throw new Error("useShortcutManager must be used within <ShortcutProvider>")
    }

    return context
}
`,
    "index.ts": `export { ShortcutProvider, useShortcutManager, type ShortcutProviderProps } from "./provider"
export { shortcutRegistry, type ShortcutActionId, type ShortcutBindings } from "./registry"
export { defaultActiveScopes, shortcutScopes, type ShortcutScope } from "./scopes"
export type {
    ShortcutContextValue,
    ShortcutActions,
    ShortcutHandlers,
    ShortcutMeta,
    ShortcutState,
} from "./types"
`,
    "README.md": `# Shortcut Architecture Scaffold

This folder was generated by \`use-shortcut scaffold\`.

It follows a scalable architecture with a strict split between:

- **Registry (data)**: \`registry.ts\` is the single source of truth for action ids, default keys, scope ownership, and metadata.
- **Runtime assembly**: \`runtime.ts\` converts registry + current bindings + handlers into a runtime map.
- **State and actions provider**: \`provider.tsx\` owns scope state, binding overrides, and persistence.
- **Storage adapter**: \`storage.ts\` isolates persistence so you can swap \`localStorage\` for API/DB.
- **Typed contract**: \`types.ts\` exposes \`state/actions/meta\` for UI and feature modules.

## How To Extend

1. Add a new action in \`registry.ts\`.
2. Implement its handler in your app and pass it via \`handlers\` to \`<ShortcutProvider>\`.
3. Optionally expose a user-configurable key in your settings UI through \`useShortcutManager().actions.setBinding\`.
4. Activate scopes from feature boundaries (for example editor route enters \`editor\` scope).

${integrationSection}
## Rules For Scale

- Keep handlers side-effect focused and feature-owned; keep the registry declarative.
- Use scopes instead of conditionals in handlers.
- Persist only key bindings, not executable handlers.
- Treat \`registry.ts\` as your architectural contract.
`
  };
}

// cli/index.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var COLORS = {
  reset: "\x1B[0m",
  green: "\x1B[32m",
  cyan: "\x1B[36m",
  yellow: "\x1B[33m",
  dim: "\x1B[2m",
  red: "\x1B[31m"
};
function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}
function getSrcPath() {
  return join(__dirname, "..", "src");
}
function getCopyDestPath(targetDir) {
  return join(process.cwd(), targetDir, "use-shortcut");
}
function getScaffoldDestPath(targetDir, dir) {
  return join(process.cwd(), targetDir, dir);
}
function getFlagValue(args, flag, fallback) {
  const flagIndex = args.indexOf(flag);
  if (flagIndex === -1) return fallback;
  const value = args[flagIndex + 1];
  if (!value || value.startsWith("--")) return fallback;
  return value;
}
function hasFlag(args, flag) {
  return args.includes(flag);
}
var CORE_FILES = [
  "index.ts",
  "hook.ts",
  "builder.ts",
  "types.ts",
  "parser.ts",
  "constants.ts",
  "formatter.ts"
];
function init(targetDir = "hooks", force = false) {
  const srcPath = getSrcPath();
  const destPath = getCopyDestPath(targetDir);
  log("\nuse-shortcut CLI\n", COLORS.cyan);
  if (existsSync(destPath) && !force) {
    log(`Directory already exists: ${destPath}`, COLORS.yellow);
    log("Use --force to overwrite existing files\n", COLORS.dim);
    return;
  }
  mkdirSync(destPath, { recursive: true });
  let written = 0;
  for (const file of CORE_FILES) {
    const srcFile = join(srcPath, file);
    const destFile = join(destPath, file);
    if (!existsSync(srcFile)) {
      log(`Source file not found: ${file}`, COLORS.yellow);
      continue;
    }
    const content = readFileSync(srcFile, "utf-8");
    writeFileSync(destFile, content);
    written += 1;
    log(`  wrote ${file}`, COLORS.green);
  }
  log(`
Copied ${written} files to:`, COLORS.green);
  log(`  ${destPath}
`, COLORS.dim);
  log("Usage:", COLORS.cyan);
  log(`  import { useShortcut } from "@/${targetDir}/use-shortcut"`, COLORS.dim);
  log("  const $ = useShortcut()", COLORS.dim);
  log('  $.mod.key("k").on(() => console.log("Search"))\n', COLORS.dim);
}
function scaffoldArchitecture(framework, targetDir = "src", dir = "shortcuts", force = false) {
  const destPath = getScaffoldDestPath(targetDir, dir);
  const templates = _getArchitectureTemplates(framework);
  log("\nuse-shortcut CLI\n", COLORS.cyan);
  log(`Scaffolding ${framework} architecture in ${destPath}
`, COLORS.dim);
  mkdirSync(destPath, { recursive: true });
  let written = 0;
  let skipped = 0;
  for (const [file, content] of Object.entries(templates)) {
    const outputPath = join(destPath, file);
    if (existsSync(outputPath) && !force) {
      skipped += 1;
      log(`  skipped ${file} (already exists)`, COLORS.yellow);
      continue;
    }
    writeFileSync(outputPath, content);
    written += 1;
    log(`  wrote ${file}`, COLORS.green);
  }
  log("", COLORS.reset);
  log(`Architecture scaffold complete: ${written} written, ${skipped} skipped.`, COLORS.green);
  log(`Location: ${destPath}
`, COLORS.dim);
  log("Next steps:", COLORS.cyan);
  log(`  1. Open ${join(targetDir, dir, "registry.ts")} and define your action catalog`, COLORS.dim);
  log(`  2. Wire app handlers into <ShortcutProvider handlers={...} />`, COLORS.dim);
  log(`  3. Toggle scopes from feature boundaries via useShortcutManager()`, COLORS.dim);
  log(`  4. Optionally expose setBinding/resetBinding in your settings UI
`, COLORS.dim);
}
function printHelp() {
  log("\nuse-shortcut CLI\n", COLORS.cyan);
  log("Commands:", COLORS.yellow);
  log("  init [--target hooks] [--force]", COLORS.dim);
  log("      Copy source files into your project (shadcn-style).", COLORS.dim);
  log("", COLORS.dim);
  log("  scaffold [--framework next|react] [--target src] [--dir shortcuts] [--force]", COLORS.dim);
  log("      Generate a scalable app shortcut architecture.", COLORS.dim);
  log("", COLORS.dim);
  log("  init --architecture", COLORS.dim);
  log("      Alias for scaffold with defaults.\n", COLORS.dim);
}
function parseFramework(value) {
  if (value === "next" || value === "react") {
    return value;
  }
  log(`Invalid framework: ${value}. Expected "next" or "react".`, COLORS.red);
  process.exit(1);
}
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const isHelp = !command || command === "--help" || command === "-h" || command === "help";
  if (isHelp) {
    printHelp();
    return;
  }
  if (command === "init") {
    if (hasFlag(args, "--architecture") || hasFlag(args, "--app") || hasFlag(args, "--scaffold")) {
      const framework = parseFramework(getFlagValue(args, "--framework", "next"));
      const targetDir2 = getFlagValue(args, "--target", "src");
      const dir = getFlagValue(args, "--dir", "shortcuts");
      const force2 = hasFlag(args, "--force");
      scaffoldArchitecture(framework, targetDir2, dir, force2);
      return;
    }
    const targetDir = getFlagValue(args, "--target", "hooks");
    const force = hasFlag(args, "--force");
    init(targetDir, force);
    return;
  }
  if (command === "scaffold" || command === "architecture") {
    const framework = parseFramework(getFlagValue(args, "--framework", "next"));
    const targetDir = getFlagValue(args, "--target", "src");
    const dir = getFlagValue(args, "--dir", "shortcuts");
    const force = hasFlag(args, "--force");
    scaffoldArchitecture(framework, targetDir, dir, force);
    return;
  }
  printHelp();
  process.exit(1);
}
main();
