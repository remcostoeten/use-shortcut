import { type ReactNode, useEffect, useRef, useState } from "react";
import { useShortcut } from "@remcostoeten/use-shortcut/react";
import { CodeBlock } from "./CodeBlock";
import type { UiUseCase } from "@/config/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Example {
  title: string;
  description?: string;
  code: string;
  language?: string;
}

interface CodeExamplesProps {
  examples?: Example[];
  uiUseCases?: UiUseCase[];
}

const defaultExamples: Example[] = [
  {
    title: "how to use with react?",
    code: `import { usePackage } from "package-name"

function App() {
  const result = usePackage({
    option: "value",
    enabled: true,
  })

  return <div>{result.output}</div>
}`,
  },
  {
    title: "need a different setup?",
    code: `import { createInstance } from "package-name"

const instance = createInstance({
  target: document.body,
  option: "value",
})

instance.enable()`,
  },
];

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function QuickStartTester() {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const [status, setStatus] = useState("press shift+s to save or escape to dismiss");
  const [saved, setSaved] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const $ = useShortcut({ target, ignoreInputs: false });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const flashKey = (key: string) => {
    setActiveKey(key);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => setActiveKey(null), 700);
  };

  $.shift.key("s").on(() => {
    setSaved(true);
    setStatus("saved draft");
    flashKey("shift+s");
  });

  $.key("escape").on(() => {
    setPanelOpen(false);
    setStatus("dismissed panel");
    flashKey("escape");
  });

  return (
    <div className="mt-3 border border-dashed border-border bg-card/30 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Focus the tester, then press <kbd className="font-mono text-[11px] text-foreground">shift+s</kbd> or <kbd className="font-mono text-[11px] text-foreground">escape</kbd>.
        </p>
        <button
          type="button"
          onClick={() => {
            setSaved(false);
            setPanelOpen(true);
            setStatus("press shift+s to save or escape to dismiss");
            setActiveKey(null);
            target?.focus();
          }}
          className="min-h-9 border border-border px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          reset
        </button>
      </div>

      <div
        ref={setTarget}
        tabIndex={0}
        className="min-h-[132px] border border-border bg-background px-4 py-4 outline-none transition-colors focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex flex-wrap gap-2">
          <kbd className={`inline-flex min-h-7 items-center justify-center border px-2 font-mono text-[11px] transition-colors ${
            activeKey === "shift+s" ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-card text-foreground"
          }`}>
            shift+s
          </kbd>
          <kbd className={`inline-flex min-h-7 items-center justify-center border px-2 font-mono text-[11px] transition-colors ${
            activeKey === "escape" ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-card text-foreground"
          }`}>
            escape
          </kbd>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className={`border px-3 py-3 transition-colors ${saved ? "border-primary/40 bg-primary/8" : "border-border bg-card/30"}`}>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">draft</p>
            <p className="mt-2 text-sm lowercase text-foreground">{saved ? "saved" : "unsaved"}</p>
          </div>
          <div className={`border px-3 py-3 transition-colors ${panelOpen ? "border-border bg-card/30" : "border-primary/40 bg-primary/8"}`}>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">panel</p>
            <p className="mt-2 text-sm lowercase text-foreground">{panelOpen ? "open" : "dismissed"}</p>
          </div>
        </div>

        <p className="mt-4 text-sm lowercase text-foreground">{status}</p>
      </div>
    </div>
  );
}

function SequenceTester() {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const [status, setStatus] = useState("press g then d inside this box");
  const [recentKeys, setRecentKeys] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<"idle" | "success" | "failed">("idle");
  const timeoutRef = useRef<number | null>(null);
  const $ = useShortcut({ target, ignoreInputs: false, sequenceTimeout: 1200 });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!target) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const normalizedKey = event.shiftKey && key.length === 1 ? `shift+${key}` : key;
      const trackable =
        normalizedKey.length === 1
        || normalizedKey === "shift+d";

      if (!trackable) return;

      setRecentKeys((current) => {
        const next = [...current.slice(-3), normalizedKey];

        if (
          next.length >= 2
          && next[next.length - 2] === "g"
          && next[next.length - 1] !== "d"
          && next[next.length - 1] !== "shift+d"
        ) {
          setOutcome("failed");
          setStatus(`failed sequence: g then ${next[next.length - 1]}`);
        }

        return next;
      });

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setRecentKeys([]);
        setOutcome("idle");
        setStatus("press g then d inside this box");
      }, 1200);
    };

    target.addEventListener("keydown", handleKeyDown);
    return () => target.removeEventListener("keydown", handleKeyDown);
  }, [target]);

  $.key("g").then("d").on(() => {
    setOutcome("success");
    setStatus("matched g then d");
    setRecentKeys(["g", "d"]);
  });

  $.key("g").then("shift+d").on(() => {
    setOutcome("success");
    setStatus("matched g then shift+d");
    setRecentKeys(["g", "shift+d"]);
  });

  return (
    <div className="mt-3 border border-dashed border-border bg-card/30 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] lowercase text-primary">try it</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            focus the tester, then press <kbd className="font-mono text-[11px] text-foreground">g</kbd> followed by <kbd className="font-mono text-[11px] text-foreground">d</kbd>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setStatus("press g then d inside this box");
            setRecentKeys([]);
            setOutcome("idle");
            target?.focus();
          }}
          className="min-h-9 border border-border px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          reset
        </button>
      </div>

      <div
        ref={setTarget}
        tabIndex={0}
        className="min-h-[120px] border border-border bg-background px-4 py-4 outline-none transition-colors focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">
            recent keys
          </span>
          {recentKeys.length > 0 ? recentKeys.map((key, index) => (
            <kbd
              key={`${key}-${index}`}
              className="inline-flex min-h-6 min-w-[28px] items-center justify-center border border-border bg-card px-2 font-mono text-[11px] text-foreground"
            >
              {key}
            </kbd>
          )) : (
            <span className="text-xs text-muted-foreground">waiting…</span>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className={`border px-3 py-3 transition-colors ${
            outcome === "success" ? "border-primary/40 bg-primary/8" : "border-border bg-card/30"
          }`}>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">success</p>
            <p className="mt-2 text-sm lowercase text-foreground">
              {outcome === "success" ? "sequence matched" : "waiting"}
            </p>
          </div>
          <div className={`border px-3 py-3 transition-colors ${
            outcome === "failed" ? "border-red-500/40 bg-red-500/10" : "border-border bg-card/30"
          }`}>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">failed</p>
            <p className="mt-2 text-sm lowercase text-foreground">
              {outcome === "failed" ? "wrong follow-up key" : "clear"}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm lowercase text-foreground">
          {status}
        </p>
        <p className="mt-2 text-xs lowercase leading-relaxed text-muted-foreground">
          this uses the real sequence API, not a fake timer. try <kbd className="font-mono text-[11px] text-foreground">g</kbd> then <kbd className="font-mono text-[11px] text-foreground">shift+d</kbd> too.
        </p>
      </div>
    </div>
  );
}

function ExampleDetails({
  id,
  summary,
  useCase,
  children,
}: {
  id: string;
  summary: string;
  useCase?: UiUseCase;
  children?: ReactNode;
}) {
  return (
    <div className="mt-3 border border-border bg-card/40">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={id} className="border-border">
          <AccordionTrigger className="px-3 py-2.5 text-left hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="font-mono text-xs lowercase text-primary">real-world ui use case + try it</span>
              <span className="text-xs leading-relaxed text-muted-foreground">{summary}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 px-3 pb-3 pt-1">
            {useCase ? (
              <div className="space-y-3">
                {useCase.whenToUse ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    <span className="font-mono text-[11px] lowercase text-primary">when to use:</span>{" "}
                    {useCase.whenToUse}
                  </p>
                ) : null}
                <div className="space-y-2">
                  {useCase.actions.map((action) => (
                    <div
                      key={`${useCase.id}-${action.label}`}
                      className="flex items-center justify-between gap-3 border border-border bg-background px-2.5 py-2"
                    >
                      <span className="text-xs text-foreground">{action.label}</span>
                      <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center border border-border bg-muted px-1 font-mono text-[10px] text-muted-foreground">
                        {action.shortcut}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {children ? <div>{children}</div> : null}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export function CodeExamples({ examples = defaultExamples, uiUseCases = [] }: CodeExamplesProps) {
  return (
    <div className="flex flex-col gap-8 w-full">
      {examples.map((ex) => (
        <article key={ex.title} className="space-y-2">
          {(() => {
            const match = uiUseCases.find((item) => normalize(item.title) === normalize(ex.title));
            const isQuickStart = normalize(ex.title) === "quick start";

            return (
              <>
                {ex.description ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {ex.description}
                  </p>
                ) : null}
                <CodeBlock title={ex.title} code={ex.code} language={ex.language} />
                {(match || isQuickStart) ? (
                  <ExampleDetails
                    id={`example-details-${normalize(ex.title).replace(/\s+/g, "-")}`}
                    summary={
                      isQuickStart
                        ? "starter workflow notes and a live tester for shift+s and escape."
                        : match?.summary ?? ""
                    }
                    useCase={match}
                  >
                    {isQuickStart ? <QuickStartTester /> : null}
                  </ExampleDetails>
                ) : null}
                {normalize(ex.title) === "sequences & chords" ? <SequenceTester /> : null}
              </>
            );
          })()}
        </article>
      ))}
    </div>
  );
}
