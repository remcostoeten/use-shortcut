import type { PackageConfig } from "../types";
import { getPackageDocsUrl } from "../site";

const vscodeCodeRefineryConfig: PackageConfig = {
  slug: "vscode-code-refinery",
  kind: "extension",
  packageName: "vscode-code-refinery",
  installName: "remcostoeten.vscode-code-refinery",
  heroTitle: "vscode-code-refinery",
  tagline: "editor workflow",
  description:
    "a general-purpose vscode extension for refactors, naming cleanup, barrel generation, and low-friction typescript file maintenance.",
  heroSubcopy:
    "built for repetitive editor chores: rename files to kebab-case, rewrite exports, clean unused code, and keep local component props conventions consistent.",
  author: {
    name: "Remco Stoeten",
    handle: "@remcostoeten",
    url: "https://github.com/remcostoeten",
  },
  navLinks: [
    { label: "install", url: "#install" },
    { label: "commands", url: "#api-reference" },
    { label: "settings", url: "#api" },
    { label: "usage", url: "#syntax" },
  ],
  install: {
    heading: "install the extension or run it locally in the extension host.",
    description:
      "use the marketplace install command if you publish it, or clone the repo, install deps, compile, and launch the extension development host with f5.",
    methods: [
      {
        id: "code",
        label: "code",
        command: "code --install-extension remcostoeten.vscode-code-refinery",
      },
      {
        id: "clone",
        label: "local-dev",
        command:
          "git clone https://github.com/remcostoeten/vscode-code-refinery.git && cd vscode-code-refinery && npm install && npm run compile",
      },
    ],
  },
  links: {
    github: "https://github.com/remcostoeten/vscode-code-refinery",
    docs: getPackageDocsUrl("vscode-code-refinery"),
    marketplace:
      "https://marketplace.visualstudio.com/items?itemName=remcostoeten.vscode-code-refinery",
  },
  ctas: [
    {
      label: "view source",
      url: "https://github.com/remcostoeten/vscode-code-refinery",
      primary: false,
    },
    {
      label: "open marketplace",
      url: "https://marketplace.visualstudio.com/items?itemName=remcostoeten.vscode-code-refinery",
      primary: true,
    },
  ],
  why: {
    paragraphs: [
      "this extension groups together repetitive file and export cleanups that are easy to describe but annoying to do by hand across a typescript workspace.",
      "the commands are aimed at day-to-day component and module maintenance instead of one-off code mods, so they stay close to normal explorer and command palette flows.",
    ],
  },
  features: [
    {
      value: "rename",
      label: "kebab-case file renames",
      description:
        "renames selected files from camelCase or PascalCase to kebab-case and can update relative imports in the workspace.",
    },
    {
      value: "props",
      label: "props normalization",
      description:
        "renames a single local non-exported type or interface to Props and converts interfaces into type aliases where needed.",
    },
    {
      value: "exports",
      label: "export rewrites",
      description:
        "converts supported default exports to named exports and named exports back to default while updating import and re-export sites.",
    },
    {
      value: "unused",
      label: "unused cleanup",
      description:
        "previews and removes unused imports, exports, types, functions, and variables from the current ts or tsx file.",
    },
    {
      value: "types",
      label: "interface to type",
      description:
        "converts top-level interfaces into type aliases when the transformation is safe.",
    },
    {
      value: "barrel",
      label: "index barrel generation",
      description:
        "creates an index.ts file that re-exports ts and tsx files in the selected directory.",
    },
  ],
  apiProps: [
    {
      name: "codeRefinery.rename.updateImports",
      type: "boolean",
      default: "true",
      description: "updates ts and js relative import specifiers after file renames.",
    },
    {
      name: "codeRefinery.rename.showSummary",
      type: "boolean",
      default: "true",
      description: "shows a summary message after batch renames complete.",
    },
    {
      name: "codeRefinery.rename.revealInExplorer",
      type: "boolean",
      default: "true",
      description: "reveals the renamed file in the vscode explorer after the operation finishes.",
    },
  ],
  apiCapabilities: [
    {
      name: "Convert Filename to kebab-case",
      kind: "function",
      summary: "Renames selected files into kebab-case from the explorer or command palette.",
      possible:
        "Standardize file naming without hand-editing paths, and optionally rewrite matching relative imports in the workspace.",
      example: "code --install-extension remcostoeten.vscode-code-refinery",
      exampleLanguage: "bash",
    },
    {
      name: "Rename Local Type/Interface to Props",
      kind: "function",
      summary: "Promotes a single local component shape to Props.",
      possible:
        "Normalize one-off component files so prop names and exported component signatures line up with common React conventions.",
    },
    {
      name: "Convert Default Export to Named Export",
      kind: "function",
      summary: "Previews and rewrites supported default exports to named exports.",
      possible:
        "Reduce anonymous defaults and keep import sites explicit while updating TS and TSX consumers across the workspace.",
    },
    {
      name: "Convert Named Export to Default Export",
      kind: "function",
      summary: "Previews and rewrites one supported named value export into a default export.",
      possible:
        "Useful when aligning a module to a file-name-based default export convention without manually touching imports.",
    },
    {
      name: "Remove Unused from Current TS/TSX File",
      kind: "function",
      summary: "Removes unused code from the current file with focused cleanup modes.",
      possible:
        "Clean imports, types, exports, functions, or variables without leaving the editor or applying a broader lint autofix.",
    },
    {
      name: "Convert Interfaces to Types",
      kind: "function",
      summary: "Converts top-level interfaces to type aliases where safe.",
      possible:
        "Move a codebase toward type aliases while skipping merged interfaces and default-exported interfaces that need to stay intact.",
    },
    {
      name: "Generate index.ts Barrel File",
      kind: "function",
      summary: "Builds an index.ts barrel from ts and tsx files in the selected folder.",
      possible:
        "Speed up module organization when you want a simple export surface without writing each export line by hand.",
      example: "export * from './filename';",
      exampleLanguage: "ts",
    },
  ],
  codeExamples: [
    {
      title: "explorer and keyboard flow",
      description:
        "open the explorer context menu for file and folder actions, or use the built-in keyboard shortcuts for the fastest path.",
      language: "text",
      code: `Explorer
- Right-click a file -> Convert Filename to kebab-case
- Right-click a folder -> Generate index.ts with exports

Keyboard shortcuts
- Ctrl+Alt+K -> Rename file to kebab-case
- Ctrl+Alt+I -> Generate index.ts`,
    },
    {
      title: "command palette commands",
      description:
        "every command is exposed through the command palette for keyboard-first or editor-first usage.",
      language: "text",
      code: `Cmd/Ctrl+Shift+P

Search for:
- Convert Filename to kebab-case
- Generate index.ts with exports
- Rename Local Type/Interface to Props
- Convert Default Export to Named Export
- Convert Named Export to Default Export
- Remove Unused from Current TS/TSX File
- Convert Interfaces to Types`,
    },
    {
      title: "local extension development",
      description:
        "clone, compile, and launch the extension development host locally when iterating on commands.",
      language: "bash",
      code: `git clone https://github.com/remcostoeten/vscode-code-refinery.git
cd vscode-code-refinery
npm install
npm run compile
# open the folder in VS Code and press F5`,
    },
  ],
};

export default vscodeCodeRefineryConfig;
