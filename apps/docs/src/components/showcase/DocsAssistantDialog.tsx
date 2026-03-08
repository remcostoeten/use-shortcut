import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CornerDownLeft, MessageSquareText, Search, Sparkles } from "lucide-react";
import type { PackageConfig } from "@/config/types";
import { trackDocsEvent } from "@/lib/analytics";
import {
  buildDocsAnswer,
  buildDocsKnowledge,
  buildSuggestedQuestions,
  searchDocsKnowledge,
  type DocsSearchResult,
} from "@/lib/docs-assistant";
import { scrollToDocsSection } from "@/lib/docs-navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SyntaxHighlight } from "./SyntaxHighlight";

interface AssistantRequest {
  query?: string;
  entryId?: string;
  source?: string;
  nonce?: number;
}

interface DocsAssistantDialogProps {
  config: PackageConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: AssistantRequest | null;
}

function confidenceLabel(confidence: "high" | "medium" | "low") {
  if (confidence === "high") return "grounded match";
  if (confidence === "medium") return "likely match";
  return "low confidence";
}

export function DocsAssistantDialog({
  config,
  open,
  onOpenChange,
  request,
}: DocsAssistantDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const entries = useMemo(() => buildDocsKnowledge(config), [config]);
  const suggestions = useMemo(() => buildSuggestedQuestions(entries), [entries]);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(
    () => searchDocsKnowledge(entries, deferredQuery, 14),
    [deferredQuery, entries],
  );

  const selectedResult = results[selectedIndex] ?? results[0] ?? null;
  const answerQuery = deferredQuery.trim() || selectedResult?.entry.title || "";

  const answer = useMemo(
    () => buildDocsAnswer(entries, answerQuery, 3),
    [answerQuery, entries],
  );

  useEffect(() => {
    if (!open) return;

    const nextQuery = request?.query ?? "";
    setQuery(nextQuery);
    setSelectedIndex(0);

    if (window.innerWidth >= 768) {
      window.setTimeout(() => inputRef.current?.focus(), 10);
    }

    trackDocsEvent("docs_assistant_opened", {
      query: nextQuery || undefined,
      source: request?.source ?? "unknown",
    });
  }, [open, request?.entryId, request?.nonce, request?.query, request?.source]);

  useEffect(() => {
    if (!results.length) {
      setSelectedIndex(0);
      return;
    }

    if (request?.entryId) {
      const index = results.findIndex((result) => result.entry.id === request.entryId);
      if (index >= 0) {
        setSelectedIndex(index);
        return;
      }
    }

    setSelectedIndex((current) => Math.min(current, results.length - 1));
  }, [request?.entryId, results]);

  const goToEntry = (result: DocsSearchResult) => {
    trackDocsEvent("docs_assistant_result_opened", {
      entryId: result.entry.id,
      kind: result.entry.kind,
      sectionId: result.entry.sectionId,
      query: deferredQuery || undefined,
    });
    onOpenChange(false);
    window.setTimeout(() => {
      scrollToDocsSection(result.entry.sectionId);
    }, 30);
  };

  const handleQuerySubmit = () => {
    trackDocsEvent("docs_assistant_queried", {
      query: deferredQuery || undefined,
      results: results.length,
      topEntryId: results[0]?.entry.id,
    });

    if (selectedResult) {
      goToEntry(selectedResult);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-5xl overflow-hidden border-border bg-background p-0 shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,98,0,0.16),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_24%)]" aria-hidden="true" />
        <DialogHeader className="relative border-b border-border/80 px-4 pb-4 pt-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 text-left">
              <DialogTitle className="font-display text-xl lowercase tracking-tight text-foreground">
                ask the docs
              </DialogTitle>
              <DialogDescription className="max-w-2xl text-xs lowercase leading-relaxed text-muted-foreground">
                grounded answers only. props, exports, setup, examples, and api details come from this package config.
              </DialogDescription>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="inline-flex min-h-8 items-center border border-border bg-card/60 px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                no external ai
              </span>
            </div>
          </div>

          <form
            className="mt-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleQuerySubmit();
            }}
          >
            <label className="relative flex min-h-12 items-center border border-border bg-card/70 pl-11 pr-12 text-left transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-ring">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/85" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setSelectedIndex((current) => Math.min(current + 1, Math.max(results.length - 1, 0)));
                  }

                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setSelectedIndex((current) => Math.max(current - 1, 0));
                  }
                }}
                placeholder="ask about a prop, setup, export, or example…"
                className="h-full w-full bg-transparent font-mono text-base lowercase text-foreground outline-none placeholder:text-muted-foreground sm:text-sm"
                aria-label="Ask the docs"
                inputMode="search"
                spellCheck={false}
              />
              <button
                type="submit"
                className="absolute right-2 inline-flex min-h-9 min-w-9 items-center justify-center border border-border bg-background/80 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Open selected result"
              >
                <CornerDownLeft className="h-4 w-4" />
              </button>
            </label>
          </form>

          <div aria-live="polite" className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>{results.length} results</span>
            <span aria-hidden="true">/</span>
            <span>{confidenceLabel(answer.confidence)}</span>
            <span aria-hidden="true">/</span>
            <span>enter opens</span>
            <span aria-hidden="true">/</span>
            <span>arrow keys browse</span>
          </div>
        </DialogHeader>

        <div className="relative grid max-h-[78vh] min-h-[520px] grid-rows-[minmax(0,1fr)_minmax(0,1fr)] overscroll-contain md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] md:grid-rows-1">
          <section className="border-b border-border/80 bg-card/28 md:border-b-0 md:border-r" aria-label="Search results">
            <div className="border-b border-dashed border-border/80 px-4 py-3 sm:px-5">
              <p className="font-mono text-[11px] lowercase text-primary">search results</p>
              <p className="mt-1 text-xs lowercase leading-relaxed text-muted-foreground">
                exact prop names and export names rank highest.
              </p>
            </div>

            {query.trim().length === 0 && suggestions.length > 0 ? (
              <div className="border-b border-dashed border-border/80 px-4 py-3 sm:px-5">
                <p className="mb-2 font-mono text-[11px] lowercase text-muted-foreground">try one</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setQuery(suggestion)}
                      className="inline-flex min-h-9 items-center border border-border bg-background/70 px-3 text-left font-mono text-[11px] lowercase text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="max-h-full overflow-y-auto px-2 py-2 sm:px-3">
              {results.length > 0 ? (
                <div className="grid gap-2">
                  {results.map((result, index) => {
                    const active = index === selectedIndex;

                    return (
                      <button
                        key={result.entry.id}
                        type="button"
                        onClick={() => setSelectedIndex(index)}
                        onDoubleClick={() => goToEntry(result)}
                        className={[
                          "group flex min-h-16 w-full items-start justify-between gap-3 border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          active
                            ? "border-primary/50 bg-primary/10 text-foreground"
                            : "border-border bg-background/70 text-foreground hover:border-primary/30 hover:bg-card/80",
                        ].join(" ")}
                        aria-pressed={active}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-semibold lowercase text-primary">
                              {result.entry.title}
                            </span>
                            <span className="inline-flex min-h-6 items-center border border-border bg-card px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                              {result.entry.kind}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] lowercase text-muted-foreground">
                            {result.entry.sectionLabel}
                          </p>
                          <p className="mt-2 line-clamp-2 text-xs lowercase leading-relaxed text-muted-foreground">
                            {result.entry.summary}
                          </p>
                        </div>

                        <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
                          {result.score}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center px-5 text-center">
                  <MessageSquareText className="h-8 w-8 text-muted-foreground/40" aria-hidden="true" />
                  <p className="mt-4 font-display text-lg lowercase text-foreground">no grounded match</p>
                  <p className="mt-2 max-w-sm text-sm lowercase leading-relaxed text-muted-foreground">
                    try an exact prop like <span className="font-mono">ignoreInputs</span> or a concrete question like install, scopes, or sequences.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="relative flex min-h-0 flex-col bg-background/96" aria-label="Grounded answer">
            <div className="border-b border-dashed border-border/80 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <p className="font-mono text-[11px] lowercase text-primary">grounded answer</p>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              <article className="border border-border bg-card/35 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-xl lowercase tracking-tight text-foreground">
                    {answer.headline}
                  </h3>
                  <span className="inline-flex min-h-7 items-center border border-border bg-background px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {confidenceLabel(answer.confidence)}
                  </span>
                </div>

                <p className="mt-3 max-w-2xl text-sm lowercase leading-relaxed text-muted-foreground">
                  {answer.summary}
                </p>

                {answer.bullets.length > 0 ? (
                  <ul className="mt-4 grid gap-2" aria-label="Answer details">
                    {answer.bullets.map((bullet) => (
                      <li key={bullet} className="border-l border-primary/30 pl-3 text-sm lowercase leading-relaxed text-foreground/90">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {answer.example ? (
                  <div className="mt-5">
                    <p className="mb-2 font-mono text-[11px] lowercase text-primary">example</p>
                    <pre className="overflow-x-hidden border border-border bg-background p-3 text-[11px] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                      <SyntaxHighlight
                        code={answer.example}
                        language={answer.exampleLanguage ?? "tsx"}
                      />
                    </pre>
                  </div>
                ) : null}
              </article>

              <div className="mt-4">
                <p className="mb-2 font-mono text-[11px] lowercase text-primary">citations</p>
                <div className="grid gap-2">
                  {answer.citations.map((result) => (
                    <button
                      key={result.entry.id}
                      type="button"
                      onClick={() => goToEntry(result)}
                      className="flex min-h-11 items-center justify-between gap-3 border border-border bg-card/20 px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-card/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-xs lowercase text-foreground">
                          {result.entry.title}
                        </p>
                        <p className="mt-1 text-[11px] lowercase text-muted-foreground">
                          {result.entry.sectionLabel}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>

              {selectedResult ? (
                <div className="mt-4 border border-dashed border-border bg-card/18 p-3">
                  <button
                    type="button"
                    onClick={() => goToEntry(selectedResult)}
                    className="inline-flex min-h-10 items-center gap-2 border border-primary/40 bg-primary/10 px-3 font-mono text-[11px] lowercase text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    jump to {selectedResult.entry.sectionLabel}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
