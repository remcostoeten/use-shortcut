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
    <div className="w-full">
      {title && (
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs lowercase text-muted-foreground">{title}</span>
        </div>
      )}
      <div className="border border-border overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/20" />
            <span className="h-2 w-2 rounded-full bg-muted-foreground/20" />
            <span className="h-2 w-2 rounded-full bg-muted-foreground/20" />
          </div>
          <button
            onClick={copy}
            className="relative h-6 w-6 flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Copy code"
          >
            <Copy
              className={`h-3 w-3 absolute transition-all duration-300 ${
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
        {/* Code area with line numbers */}
        <div className="bg-background">
          <pre className="py-3">
            {lines.map((line, i) => (
              <div key={i} className="flex hover:bg-card/30 transition-colors">
                <span className="select-none w-10 shrink-0 text-right pr-4 font-mono text-[11px] leading-relaxed text-muted-foreground/25">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 border-l border-border/30 pl-4 pr-4 font-mono text-[11px] leading-relaxed break-words [overflow-wrap:anywhere]">
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
    </div>
  );
}
