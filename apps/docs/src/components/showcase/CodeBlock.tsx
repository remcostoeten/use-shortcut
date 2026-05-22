import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { SyntaxHighlight } from "./SyntaxHighlight";
import { trackDocsEvent } from "@/lib/analytics";

interface CodeBlockProps {
  title?: string;
  code: string;
  language?: string;
}

export function CodeBlock({ title, code, language = "tsx" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    trackDocsEvent("code_example_copied", {
      title: title ?? "untitled",
      language,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full overflow-hidden border border-border/80 bg-card/10">
      <div className="flex items-center justify-between gap-3 border-b border-border/80 bg-card/40 px-4 py-2">
        <div className="min-w-0">
          {title ? (
            <p className="truncate font-display text-sm font-semibold lowercase text-foreground">
              {title}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="border border-border/70 bg-background/75 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {language}
          </span>
          <button
            onClick={copy}
            className="relative flex h-8 w-8 items-center justify-center border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Copy code"
          >
            <Copy
              className={`absolute h-3.5 w-3.5 transition-all duration-300 ${
                copied
                  ? "opacity-0 scale-50 rotate-12"
                  : "opacity-100 scale-100 rotate-0"
              }`}
              style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            />
            <Check
              className={`h-3 w-3 absolute text-primary transition-all duration-300 ${
                copied
                  ? "opacity-100 scale-100 rotate-0"
                  : "opacity-0 scale-50 -rotate-12"
              }`}
              style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            />
          </button>
        </div>
      </div>
      <div className="overflow-x-hidden bg-background/95">
        <pre className="py-2">
          {lines.map((line, i) => (
            <div
              key={i}
              className="group flex min-w-0 items-start border-l border-transparent transition-colors hover:border-primary/25 hover:bg-card/20"
            >
              <span className="w-10 shrink-0 select-none px-4 py-1 text-right font-mono text-[11px] leading-[1.35] text-muted-foreground/30 tabular-nums">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 border-l border-border/40 px-4 py-1 font-mono text-[11px] leading-[1.35] whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                {line ? (
                  <SyntaxHighlight code={line} language={language} />
                ) : (
                  "\u00A0"
                )}
              </span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
