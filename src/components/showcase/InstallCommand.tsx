import { useState, useRef, useEffect } from "react";
import { Check, Copy, Download, FileCode2, Sparkles, TerminalSquare } from "lucide-react";
import { trackDocsEvent } from "@/lib/analytics";

interface InstallCommandProps {
  packageName?: string;
}

const managers = [
  { id: "npm", label: "npm", cmd: (pkg: string) => `npm i ${pkg}` },
  { id: "bun", label: "bun", cmd: (pkg: string) => `bun add ${pkg}` },
  { id: "pnpm", label: "pnpm", cmd: (pkg: string) => `pnpm add ${pkg}` },
  { id: "yarn", label: "yarn", cmd: (pkg: string) => `yarn add ${pkg}` },
];

const assets = [
  {
    href: "/llm.txt",
    label: "llm.txt",
    description: "Machine-readable package context for coding agents.",
    icon: FileCode2,
  },
  {
    href: "/agents.md",
    label: "agents.md",
    description: "Ready-made agent instructions for examples and setup.",
    icon: Download,
  },
  {
    href: "/skill.sh",
    label: "skill.sh",
    description: "Install script that points people straight to the AI prompt.",
    icon: TerminalSquare,
  },
  {
    href: "/ai-prompt.md",
    label: "ai-prompt.md",
    description: "Paste this into an AI tool to get the integration implemented.",
    icon: Sparkles,
  },
] as const;

export function InstallCommand({ packageName = "package-name" }: InstallCommandProps) {
  const [active, setActive] = useState("npm");
  const [copied, setCopied] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const command = managers.find((m) => m.id === active)!.cmd(packageName);

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
    await navigator.clipboard.writeText(command);
    setCopied(true);
    trackDocsEvent("install_command_copied", {
      packageName,
      packageManager: active,
      command,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, id: string) => {
    const currentIndex = managers.findIndex((m) => m.id === id);
    let nextIndex = null;

    if (e.key === "ArrowRight") {
      nextIndex = currentIndex === managers.length - 1 ? 0 : currentIndex + 1;
    } else if (e.key === "ArrowLeft") {
      nextIndex = currentIndex === 0 ? managers.length - 1 : currentIndex - 1;
    }

    if (nextIndex !== null) {
      const nextId = managers[nextIndex].id;
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
        <div ref={tabsRef} role="tablist" aria-label="Package managers" className="relative mb-0 flex items-center gap-1">
          <div
            className="absolute bottom-0 h-[2px] bg-primary transition-all duration-300"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />
          {managers.map((m) => (
            <button
              key={m.id}
              ref={(el) => { buttonRefs.current[m.id] = el; }}
              role="tab"
              aria-selected={active === m.id}
              tabIndex={active === m.id ? 0 : -1}
              onClick={() => {
                setActive(m.id);
                trackDocsEvent("package_manager_selected", {
                  packageName,
                  packageManager: m.id,
                });
              }}
              onKeyDown={(e) => handleKeyDown(e, m.id)}
              className={`rounded-sm px-2.5 py-1.5 font-mono text-xs lowercase transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${active === m.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
              style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            >
              [{m.label}]
            </button>
          ))}
        </div>
        <div className="mt-1 flex items-start justify-between gap-3 overflow-hidden border border-border bg-card px-4 py-3">
          <code className="min-w-0 break-words font-mono text-sm text-muted-foreground [overflow-wrap:anywhere]" aria-label={`Install command: ${command}`}>
            <span className="text-primary" aria-hidden="true">$</span> {command}
          </code>
          <button
            onClick={copy}
            className="relative ml-auto flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Copy install command"
          >
            <Copy
              className={`absolute h-4 w-4 transition-all duration-300 ${copied ? "rotate-12 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"
                }`}
              style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            />
            <Check
              className={`absolute h-4 w-4 text-primary transition-all duration-300 ${copied ? "rotate-0 scale-100 opacity-100" : "-rotate-12 scale-50 opacity-0"
                }`}
              style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            />
          </button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {assets.map((asset) => {
            const Icon = asset.icon;
            return (
              <a
                key={asset.href}
                href={asset.href}
                download
                onClick={() => {
                  trackDocsEvent("install_asset_downloaded", {
                    packageName,
                    asset: asset.label,
                    href: asset.href,
                  });
                }}
                className="group flex min-h-24 touch-manipulation flex-col justify-between border border-border bg-background px-3 py-3 transition-colors hover:border-primary/50 hover:bg-card/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[11px] lowercase text-primary">{asset.label}</span>
                  <Icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden="true" />
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {asset.description}
                </p>
              </a>
            );
          })}
        </div>
      </div>
      <div className="border border-dashed border-border bg-card/20 px-4 py-3">
        <p className="font-mono text-[11px] lowercase text-primary">what to grab</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          `skill.sh` handles install, `ai-prompt.md` gives the exact prompt to hand to an AI, and `llm.txt` plus
          `agents.md` give the model enough context to implement it correctly.
        </p>
      </div>
    </div>
  );
}
