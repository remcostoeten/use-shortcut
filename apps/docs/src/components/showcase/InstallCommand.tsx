import { useState, useRef, useEffect } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Check, Copy, Download, Eye, FileCode2, HelpCircle, TerminalSquare } from "lucide-react";
import { trackDocsEvent } from "@/lib/analytics";
import { PACKAGE_DOCS_URL, PACKAGE_REPO_URL } from "@/config/site";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SyntaxHighlight } from "./SyntaxHighlight";

interface InstallCommandProps {
  packageName?: string;
}

const managers = [
  { id: "bun", label: "bun", cmd: (pkg: string) => `bun add ${pkg}` },
  { id: "pnpm", label: "pnpm", cmd: (pkg: string) => `pnpm add ${pkg}` },
  { id: "npm", label: "npm", cmd: (pkg: string) => `npm i ${pkg}` },
  { id: "yarn", label: "yarn", cmd: (pkg: string) => `yarn add ${pkg}` },
];

const getLlmAssetContent = () => `# use-shortcut

## Package
- npm: @remcostoeten/use-shortcut
- docs: ${PACKAGE_DOCS_URL}
- github: ${PACKAGE_REPO_URL}

## What this is
Typed keyboard shortcuts for React with a chainable API for combos, sequences, scopes, and guards. Cross-platform mod support works on macOS, Windows, and Linux.

## Install first
\`\`\`bash
npm install @remcostoeten/use-shortcut
\`\`\`

## If you are an LLM implementing this package
- Install the package before writing code.
- Import \`useShortcut\` from \`@remcostoeten/use-shortcut/react\`.
- Prefer React + TypeScript examples.
- Default to \`ignoreInputs: true\` unless the product clearly wants shortcuts inside editable fields.
- Add \`preventDefault: true\` for browser-conflicting combos like \`mod+k\` and \`mod+s\`.
- Use \`debug: { includeCode, includeLocation, includeKeyCode }\` when the user wants richer key debugging output.
- Use \`$.onDebug(...)\` for global keystroke telemetry and \`result.onAttempt(...)\` for per-shortcut match details.
- Represent help as \`shift+slash\`, not \`?\`.
- Use \`.except("typing")\` for global shortcuts that should not fire while the user is typing.
- Use scopes like \`.in(...)\` for context-specific bindings.

## Minimal example
\`\`\`tsx
import { useShortcut } from "@remcostoeten/use-shortcut/react"

function App() {
  const $ = useShortcut({ ignoreInputs: true })

  $.mod.key("k").on(() => openCommandPalette(), { preventDefault: true })
  $.shift.key("slash").except("typing").on(() => setHelpOpen(true))

  return null
}
\`\`\`

## Mental model
- \`useShortcut()\` returns a chain builder
- Use \`$.mod\`, \`$.cmd\`, \`$.shift\` for modifiers
- Use \`.key(...)\` to define the key
- Use \`.then(...)\` for sequences
- Use \`.on(handler, options?)\` to register
- Use \`.except(...)\` and \`.in(...)\` to scope behavior
- Use \`$.onDebug()\` for global debug flows and \`result.onAttempt()\` for binding-level debug UI
- Use \`$.record()\` to capture shortcuts from users`;

const assetContent: Record<string, string> = {
  "/llm.txt": getLlmAssetContent(),
  "/skill.sh": `npx skills add ${PACKAGE_REPO_URL} --skill use-shortcut`,
};

const assets = [
  {
    href: "/skill.sh",
    label: "skills.sh",
    title: "Install the agent skill",
    description: "Install the use-shortcut skill for AI agents using the skills.sh CLI.",
    tooltip: "Registers this repository as a Vercel skills.sh skill for AI agents. Installed agents can automatically load the guide, understand the use-shortcut API, and apply the correct patterns when generating code.",
    icon: TerminalSquare,
  },
  {
    href: "/llm.txt",
    label: "llm.txt",
    title: "Hand this to your LLM",
    description: "Give this to an LLM. It explains how to install and implement the package correctly.",
    icon: FileCode2,
  },
] as const;

type Manager = (typeof managers)[number];
type Asset = (typeof assets)[number];
type TabItem =
  | { kind: "manager"; id: string; label: string; manager: Manager }
  | { kind: "asset"; id: string; label: string; asset: Asset };

export function InstallCommand({ packageName = "package-name" }: InstallCommandProps) {
  const [active, setActive] = useState("npm");
  const [copied, setCopied] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingAsset, setViewingAsset] = useState<typeof assets[number] | null>(null);
  const [copiedAsset, setCopiedAsset] = useState<string | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const tabItems: TabItem[] = [
    ...managers.map((manager) => ({
      kind: "manager" as const,
      id: manager.id,
      label: manager.label,
      manager,
    })),
    ...assets.map((asset) => ({
      kind: "asset" as const,
      id: asset.href,
      label: asset.label,
      asset,
    })),
  ];
  const activeTab = tabItems.find((item) => item.id === active) ?? tabItems[0];
  const command = activeTab.kind === "manager" ? activeTab.manager.cmd(packageName) : null;
  const activeAsset = activeTab.kind === "asset" ? activeTab.asset : null;
  const activeAssetContent = activeAsset ? assetContent[activeAsset.href] || "" : null;

  useEffect(() => {
    const btn = buttonRefs.current[active];
    if (btn && tabsRef.current) {
      const containerRect = tabsRef.current.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setIndicatorStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [active]);

  const copy = async () => {
    if (!command) return;
    await navigator.clipboard.writeText(command);
    setCopied(true);
    trackDocsEvent("install_command_copied", {
      packageName,
      packageManager: active,
      command,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const copyAsset = async (content: string, label: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedAsset(label);
    trackDocsEvent("install_asset_copied", { packageName, asset: label });
    setTimeout(() => setCopiedAsset(null), 2000);
  };

  const handleView = (asset: typeof assets[number]) => {
    setViewingAsset(asset);
    setViewDialogOpen(true);
    trackDocsEvent("install_asset_viewed", { packageName, asset: asset.label });
  };

  const handleDownload = (asset: typeof assets[number]) => {
    const link = document.createElement("a");
    link.href = asset.href;
    link.download = asset.label;
    link.click();
    trackDocsEvent("install_asset_downloaded", { packageName, asset: asset.label });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, id: string) => {
    const currentIndex = tabItems.findIndex((item) => item.id === id);
    let nextIndex = null;

    if (e.key === "ArrowRight") {
      nextIndex = currentIndex === tabItems.length - 1 ? 0 : currentIndex + 1;
    } else if (e.key === "ArrowLeft") {
      nextIndex = currentIndex === 0 ? tabItems.length - 1 : currentIndex - 1;
    }

    if (nextIndex !== null) {
      const nextId = tabItems[nextIndex].id;
      setActive(nextId);
      buttonRefs.current[nextId]?.focus();
    }
  };

  return (
    <div className="w-full space-y-4">
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied command to clipboard" : ""}
      </span>
      <div className="border border-border bg-card/35 p-3">
        <div
          ref={tabsRef}
          role="tablist"
          aria-label="Install options"
          className="relative mb-0 flex flex-wrap items-center gap-1"
        >
          <div
            className="absolute bottom-0 h-[2px] bg-primary transition-all duration-300"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />
          {tabItems.map((item) => (
            <button
              key={item.id}
              ref={(el) => { buttonRefs.current[item.id] = el; }}
              role="tab"
              aria-selected={active === item.id}
              tabIndex={active === item.id ? 0 : -1}
              onClick={() => {
                setActive(item.id);
                if (item.kind === "manager") {
                  trackDocsEvent("package_manager_selected", {
                    packageName,
                    packageManager: item.manager.id,
                  });
                } else {
                  trackDocsEvent("install_asset_selected", {
                    packageName,
                    asset: item.asset.label,
                  });
                }
              }}
              onKeyDown={(e) => handleKeyDown(e, item.id)}
              className={`px-2.5 py-1.5 font-mono text-xs lowercase transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${active === item.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
              style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            >
              [{item.label}]
            </button>
          ))}
        </div>
        <div className="mt-2 border border-border bg-background px-4 py-3">
          {command ? (
            <div className="flex items-start justify-between gap-3 overflow-hidden border border-border bg-card px-4 py-3">
              <div
                className="flex min-w-0 flex-1 items-start gap-2 overflow-hidden"
                aria-label={`Install command: ${command}`}
              >
                <span className="select-none font-mono text-sm text-primary" aria-hidden="true">$</span>
                <pre className="min-w-0 flex-1 overflow-x-auto font-mono text-sm leading-relaxed text-muted-foreground">
                  <SyntaxHighlight code={command} language="bash" />
                </pre>
              </div>
              <button
                type="button"
                onClick={copy}
                className="relative ml-auto flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Copy install command"
              >
                <Copy
                  className={`absolute h-4 w-4 transition-all duration-300 ${copied ? "rotate-12 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"}`}
                  style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
                />
                <Check
                  className={`absolute h-4 w-4 text-primary transition-all duration-300 ${copied ? "rotate-0 scale-100 opacity-100" : "-rotate-12 scale-50 opacity-0"}`}
                  style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
                />
              </button>
            </div>
          ) : activeAsset && activeAssetContent ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <activeAsset.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span className="font-mono text-[11px] lowercase text-primary">{activeAsset.label}</span>
                    {"tooltip" in activeAsset ? (
                      <Tooltip.Provider delayDuration={300}>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <button
                              type="button"
                              className="flex h-5 w-5 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              aria-label={`More info about ${activeAsset.label}`}
                            >
                              <HelpCircle className="h-3 w-3" />
                            </button>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content
                              className="z-50 max-w-[280px] border bg-popover p-3 text-xs text-popover-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                              sideOffset={5}
                            >
                              <p className="leading-relaxed text-foreground">{activeAsset.tooltip}</p>
                              <Tooltip.Arrow className="fill-popover" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    ) : null}
                  </div>
                  <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted-foreground">
                    {activeAsset.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copyAsset(activeAssetContent, activeAsset.label)}
                    className="inline-flex min-h-9 items-center gap-2 border border-border px-3 text-xs text-foreground transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Copy ${activeAsset.label} to clipboard`}
                  >
                    {copiedAsset === activeAsset.label ? (
                      <>
                        <Check className="h-4 w-4 text-primary" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleView(activeAsset)}
                    className="inline-flex min-h-9 items-center gap-2 border border-border px-3 text-xs text-foreground transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`View ${activeAsset.label}`}
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(activeAsset)}
                    className="inline-flex min-h-9 items-center gap-2 border border-border px-3 text-xs text-foreground transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Download ${activeAsset.label}`}
                  >
                    <Download className="h-4 w-4" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
              <div className="flex items-start justify-between gap-3 overflow-hidden border border-border bg-card px-4 py-3">
                <div className="flex min-w-0 flex-1 items-start gap-2 overflow-hidden">
                  <span className="select-none font-mono text-sm text-primary" aria-hidden="true">
                    {activeAsset.href === "/skill.sh" ? "$" : "#"}
                  </span>
                  <pre className="min-w-0 flex-1 overflow-x-auto font-mono text-sm leading-relaxed text-muted-foreground">
                    <SyntaxHighlight code={activeAssetContent} language={activeAsset.href === "/skill.sh" ? "bash" : "md"} />
                  </pre>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono">{viewingAsset?.label}</DialogTitle>
            <DialogDescription>
              {viewingAsset?.description}
            </DialogDescription>
          </DialogHeader>
          <pre className="mt-2 overflow-x-auto border bg-muted p-4 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
            {viewingAsset ? (
              <SyntaxHighlight
                code={assetContent[viewingAsset.href]}
                language={viewingAsset.href === "/skill.sh" ? "bash" : "md"}
              />
            ) : null}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
