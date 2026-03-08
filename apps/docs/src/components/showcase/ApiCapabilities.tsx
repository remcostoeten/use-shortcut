import { useEffect, useMemo, useState } from "react";
import type { ApiCapability } from "@/config/types";
import { SyntaxHighlight } from "./SyntaxHighlight";

interface Props {
  capabilities: ApiCapability[];
}

const KINDS: Array<"function" | "constant" | "type"> = ["function", "constant", "type"];
const TOKEN_SPLIT = /[^a-z0-9]+/g;
const INITIAL_VISIBLE_RESULTS = 5;

function _fallbackExample(item: ApiCapability): string {
  if (item.kind === "function") {
    if (item.name === "useShortcut") {
      return 'const $ = useShortcut()\\n$.mod.key("s").on(() => save())';
    }
    if (item.name === "formatShortcut") return 'formatShortcut("mod+s")';
    if (item.name === "detectPlatform") return "const platform = detectPlatform()";
    if (item.name === "parseShortcut") return 'const parsed = parseShortcut("mod+shift+p")';
    if (item.name === "parseShortcuts") return 'const parsedList = parseShortcuts(["mod+s", "escape"])';
    if (item.name === "matchesShortcut") return "if (matchesShortcut(event, parsed)) runAction()";
    if (item.name === "matchesAnyShortcut") return "if (matchesAnyShortcut(event, parsedList)) runAction()";
    return `${item.name}(...)`;
  }

  return item.name;
}

function normalize(text: string): string {
  return text.toLowerCase();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(TOKEN_SPLIT)
    .map((token) => token.trim())
    .filter(Boolean);
}

function semanticAliases(token: string): string[] {
  const map: Record<string, string[]> = {
    shortcut: ["hotkey", "keybind", "binding", "combo"],
    hotkey: ["shortcut", "keybind", "binding", "combo"],
    parse: ["parser", "normalize", "tokenize"],
    match: ["compare", "detect", "check"],
    scope: ["context", "namespace"],
    record: ["capture", "listen"],
    format: ["display", "label", "symbol"],
    conflict: ["collision", "overlap"],
  };
  return map[token] ?? [];
}

function itemKeywords(item: ApiCapability): string[] {
  const name = item.name.toLowerCase();
  const out: string[] = [];

  if (name.includes("format")) out.push("display", "label", "symbol");
  if (name.includes("parse")) out.push("normalize", "parser");
  if (name.includes("match")) out.push("compare", "detect", "check");
  if (name.includes("scope")) out.push("context", "namespace");
  if (name.includes("record")) out.push("capture", "listen");
  if (name.includes("conflict")) out.push("collision", "overlap");
  if (name.includes("shortcut")) out.push("hotkey", "keybind", "binding");

  return out;
}

function scoreCapability(item: ApiCapability, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 1;

  const tokens = tokenize(q);
  if (!tokens.length) return 1;

  const name = item.name.toLowerCase();
  const summary = item.summary.toLowerCase();
  const possible = item.possible.toLowerCase();
  const corpus = `${name} ${summary} ${possible} ${itemKeywords(item).join(" ")}`;

  let score = 0;

  if (name === q) score += 200;
  if (name.startsWith(q)) score += 120;
  if (name.includes(q)) score += 90;
  if (summary.includes(q)) score += 50;
  if (possible.includes(q)) score += 40;

  for (const token of tokens) {
    if (name === token) score += 100;
    if (name.startsWith(token)) score += 45;
    if (name.includes(token)) score += 35;
    if (summary.includes(token)) score += 20;
    if (possible.includes(token)) score += 14;

    const aliases = semanticAliases(token);
    for (const alias of aliases) {
      if (corpus.includes(alias)) score += 10;
    }
  }

  return score;
}

export function ApiCapabilities({ capabilities }: Props) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<(typeof KINDS)[number]>("function");
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const [flashResultIndex, setFlashResultIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    const scored = capabilities
      .filter((item) => item.kind === kind)
      .map((item) => ({ item, score: scoreCapability(item, normalizedQuery) }))
      .filter(({ score }) => normalizedQuery.length === 0 || score > 0)
      .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
    return scored.map(({ item }) => item);
  }, [capabilities, kind, normalizedQuery]);

  useEffect(() => {
    if (filtered.length === 0) {
      setActiveResultIndex(0);
      return;
    }
    setActiveResultIndex((prev) => Math.min(prev, filtered.length - 1));
  }, [filtered.length]);

  useEffect(() => {
    if (normalizedQuery.length > 0) {
      setShowAll(true);
      return;
    }
    setShowAll(false);
  }, [kind, normalizedQuery]);

  useEffect(() => {
    const active = document.getElementById(`api-capability-result-${activeResultIndex}`);
    active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeResultIndex]);

  useEffect(() => {
    const handleExternalSearch = (event: Event) => {
      const detail = (event as CustomEvent<string | { query?: string }>).detail;
      const externalQuery = typeof detail === "string" ? detail : detail?.query ?? "";

      setQuery(externalQuery);
      setKind("function");
    };

    window.addEventListener("docs:api-search", handleExternalSearch as EventListener);
    return () => window.removeEventListener("docs:api-search", handleExternalSearch as EventListener);
  }, []);

  useEffect(() => {
    const handleSearchNav = (event: Event) => {
      const detail = (event as CustomEvent<{ direction?: "next" | "prev" }>).detail;
      if (!detail?.direction || filtered.length === 0) return;

      setActiveResultIndex((prev) => {
        const nextIndex = detail.direction === "next"
          ? (prev + 1) % filtered.length
          : prev === 0
            ? filtered.length - 1
            : prev - 1;
        setFlashResultIndex(nextIndex);
        return nextIndex;
      });
    };

    window.addEventListener("docs:api-search-nav", handleSearchNav as EventListener);
    return () => window.removeEventListener("docs:api-search-nav", handleSearchNav as EventListener);
  }, [filtered.length]);

  useEffect(() => {
    if (flashResultIndex === null) return;
    const timer = window.setTimeout(() => setFlashResultIndex(null), 700);
    return () => window.clearTimeout(timer);
  }, [flashResultIndex]);

  useEffect(() => {
    if (activeResultIndex >= INITIAL_VISIBLE_RESULTS) {
      setShowAll(true);
    }
  }, [activeResultIndex]);

  const visibleItems = showAll ? filtered : filtered.slice(0, INITIAL_VISIBLE_RESULTS);
  const shouldCollapse = normalizedQuery.length === 0 && filtered.length > INITIAL_VISIBLE_RESULTS;

  return (
    <section aria-label="API capabilities" className="w-full">
      <div className="mb-5 border border-border bg-card/40 p-3">
        <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filter by export kind">
          {KINDS.map((value) => {
            const active = value === kind;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setKind(value)}
                className={[
                  "inline-flex min-h-11 items-center border px-2.5 font-mono text-[11px] lowercase transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                ].join(" ")}
                aria-pressed={active}
              >
                {value}
              </button>
            );
          })}
        </div>

        <div className="font-mono text-[11px] text-muted-foreground lowercase">
          {filtered.length} results found
          {" • "}
          showing {filtered.length} of {capabilities.length} exports
          {normalizedQuery ? " (ranked by relevance)" : ""}
        </div>
        <div className="mt-2 flex items-center gap-2 font-mono text-[10px] lowercase text-muted-foreground">
          <span>use header search</span>
          <span>•</span>
          <span>jump results:</span>
          <kbd className="inline-flex h-5 min-w-[22px] items-center justify-center border border-border bg-secondary px-1 text-[10px] uppercase">
            n
          </kbd>
          <span>next</span>
          <kbd className="inline-flex h-5 min-w-[22px] items-center justify-center border border-border bg-secondary px-1 text-[10px] uppercase">
            b
          </kbd>
          <span>previous</span>
        </div>
      </div>

      <div className="relative">
        <div className="grid gap-3">
          {visibleItems.map((item, index) => (
            <article
              key={item.name}
              id={`api-capability-result-${index}`}
              tabIndex={0}
              onFocus={() => setActiveResultIndex(index)}
              className="group border border-border bg-gradient-to-br from-card via-card to-card/60 p-4 shadow-[0_0_0_1px_hsl(var(--border)/0.25)] transition-colors hover:border-primary/50"
              data-active={activeResultIndex === index ? "true" : "false"}
              data-flash={flashResultIndex === index ? "true" : "false"}
              aria-current={activeResultIndex === index ? "true" : undefined}
              style={
                activeResultIndex === index
                  ? { boxShadow: "0 0 0 1px hsl(var(--primary) / 0.6)" }
                  : undefined
              }
            >
              <header className="mb-2 flex items-start justify-between gap-3">
                <h3 className="font-mono text-xs font-semibold text-foreground">{item.name}</h3>
                <span className="inline-flex min-h-7 items-center border border-border bg-background px-2 font-mono text-[10px] lowercase text-primary">
                  {item.kind}
                </span>
              </header>

              <p className="mb-2 text-xs lowercase text-foreground/90">{item.summary}</p>
              <p className="text-xs lowercase leading-relaxed text-muted-foreground">{item.possible}</p>

              <div className="mt-3 border-t border-dashed border-border pt-3">
                <div className="mb-2">
                  <p className="mb-1 font-mono text-[11px] lowercase text-primary">example</p>
                  <pre className="border border-border bg-background p-3 text-[11px] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                    <SyntaxHighlight code={item.example || _fallbackExample(item)} language={item.exampleLanguage ?? "tsx"} />
                  </pre>
                </div>

                {item.result ? (
                  <div>
                    <p className="mb-1 font-mono text-[11px] lowercase text-emerald-400">result</p>
                    <pre className="border border-border bg-background p-3 text-[11px] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                      <SyntaxHighlight code={item.result} language={item.resultLanguage ?? "json"} />
                    </pre>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
        {shouldCollapse && !showAll ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background via-background/94 to-transparent"
            aria-hidden="true"
          />
        ) : null}
      </div>

      {shouldCollapse ? (
        <div className="mt-4 flex items-center justify-between gap-3 border border-dashed border-border bg-card/30 px-3 py-3">
          <p className="text-xs lowercase text-muted-foreground">
            showing {visibleItems.length} of {filtered.length} exports.
          </p>
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="inline-flex min-h-10 items-center border border-border px-3 font-mono text-[11px] lowercase text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={showAll}
          >
            {showAll ? "show less" : "show all"}
          </button>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="mt-3 border border-dashed border-border bg-card/40 px-4 py-6 text-center">
          <p className="font-mono text-xs lowercase text-muted-foreground">
            no exports match your current search/filter.
          </p>
        </div>
      ) : null}
    </section>
  );
}
