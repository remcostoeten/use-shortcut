import { useEffect, useMemo, useState } from "react";
import { Search, Github, Menu, X } from "lucide-react";
import type { NavLink as ShowcaseNavLink } from "@/config/types";
import { Link } from "react-router-dom";

interface NavbarProps {
  packageName: string;
  navLinks: ShowcaseNavLink[];
  githubUrl: string;
}

export function Navbar({ packageName, navLinks, githubUrl }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeHash, setActiveHash] = useState<string>("");
  const [docsMatchIds, setDocsMatchIds] = useState<string[]>([]);
  const [docsMatchCursor, setDocsMatchCursor] = useState(0);

  const anchorLinks = useMemo(
    () => navLinks.filter((link) => link.url.startsWith("#")),
    [navLinks],
  );
  const externalLinks = useMemo(
    () => navLinks.filter((link) => !link.url.startsWith("#")),
    [navLinks],
  );

  const scrollToHash = (hash: string) => {
    if (!hash.startsWith("#")) return false;
    const id = hash.slice(1);
    const target = document.getElementById(id);
    if (!target) return false;

    const nav = document.getElementById("docs-navbar");
    const navOffset = nav?.offsetHeight ?? 0;
    const top = target.getBoundingClientRect().top + window.scrollY - navOffset - 8;
    window.scrollTo({ top, behavior: "smooth" });
    setActiveHash(hash);
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", hash);
    }
    return true;
  };

  useEffect(() => {
    if (anchorLinks.length === 0) return;

    const ids = anchorLinks.map((link) => link.url.replace(/^#/, "")).filter(Boolean);
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));

    if (sections.length === 0) return;

    const byTop = [...sections].sort(
      (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top,
    );
    const first = byTop[0];
    if (first) {
      setActiveHash(`#${first.id}`);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const topMost = visible[0];
        if (topMost?.target instanceof HTMLElement) {
          setActiveHash(`#${topMost.target.id}`);
        }
      },
      {
        root: null,
        rootMargin: "-52px 0px -60% 0px",
        threshold: [0.05, 0.2, 0.4],
      },
    );

    sections.forEach((section) => observer.observe(section));

    const handleHashChange = () => {
      if (window.location.hash) {
        setActiveHash(window.location.hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [anchorLinks]);

  const dispatchSearchQuery = (query: string) => {
    window.dispatchEvent(
      new CustomEvent("docs:api-search", {
        detail: { query },
      }),
    );
  };

  const dispatchSearchNav = (direction: "next" | "prev") => {
    window.dispatchEvent(
      new CustomEvent("docs:api-search-nav", {
        detail: { direction },
      }),
    );
  };

  const runSearch = (query: string) => {
    dispatchSearchQuery(query);
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.length === 0) return;

    if (docsMatchIds.length > 0) {
      const first = docsMatchIds[0];
      if (first) {
        setDocsMatchCursor(0);
        scrollToHash(`#${first}`);
      }
      return;
    }

    const fallbackTarget = document.getElementById("api-reference") || document.getElementById("api");
    if (fallbackTarget) {
      scrollToHash(`#${fallbackTarget.id}`);
    }
  };

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setDocsMatchIds([]);
      setDocsMatchCursor(0);
      return;
    }

    const scopes = Array.from(document.querySelectorAll<HTMLElement>("[data-doc-search-scope='true']"));
    if (scopes.length === 0) {
      setDocsMatchIds([]);
      setDocsMatchCursor(0);
      return;
    }

    const tokens = query.split(/\s+/).filter(Boolean);
    const matches = scopes
      .map((scope) => {
        if (!scope.id) return null;
        const label = (scope.dataset.searchLabel ?? "").toLowerCase();
        const text = (scope.textContent ?? "").toLowerCase();
        const corpus = `${label} ${text}`;
        const isMatch = tokens.every((token) => corpus.includes(token));
        return isMatch ? scope.id : null;
      })
      .filter((id): id is string => Boolean(id));

    setDocsMatchIds(matches);
    setDocsMatchCursor(0);
  }, [searchQuery]);

  const jumpDocsMatch = (direction: "next" | "prev") => {
    if (docsMatchIds.length === 0) {
      dispatchSearchNav(direction);
      return;
    }

    const nextIndex = direction === "next"
      ? (docsMatchCursor + 1) % docsMatchIds.length
      : docsMatchCursor === 0
        ? docsMatchIds.length - 1
        : docsMatchCursor - 1;

    const targetId = docsMatchIds[nextIndex];
    setDocsMatchCursor(nextIndex);
    if (targetId) {
      scrollToHash(`#${targetId}`);
    }
  };

  return (
    <nav id="docs-navbar" className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="whitespace-nowrap font-mono text-sm font-bold lowercase tracking-wide text-foreground transition-colors hover:text-primary"
        >
          {packageName.toLowerCase()}
        </Link>

        <div className="hidden md:flex items-center gap-2 overflow-x-auto pr-2">
          {anchorLinks.map((link) => (
            <a
              key={link.label}
              href={link.url}
              onClick={(event) => {
                if (
                  event.metaKey
                  || event.ctrlKey
                  || event.shiftKey
                  || event.altKey
                  || event.button !== 0
                ) {
                  return;
                }
                event.preventDefault();
                scrollToHash(link.url);
              }}
              className={[
                "inline-flex h-8 whitespace-nowrap items-center border px-2.5 font-mono text-[11px] lowercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeHash === link.url
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
              ].join(" ")}
              aria-current={activeHash === link.url ? "location" : undefined}
            >
              {link.label}
            </a>
          ))}
          {externalLinks.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 whitespace-nowrap items-center border border-border px-2.5 font-mono text-[11px] lowercase text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative hidden md:block">
            <form
              className="relative flex h-11 w-[220px] touch-manipulation items-center border border-border bg-card/50 pl-8 pr-9 transition-colors hover:bg-card/80 focus-within:ring-1 focus-within:ring-primary"
              onSubmit={(event) => {
                event.preventDefault();
                runSearch(searchQuery);
              }}
            >
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <input
                id="docs-header-search"
                value={searchQuery}
                onChange={(event) => {
                  const value = event.target.value;
                  setSearchQuery(value);
                  dispatchSearchQuery(value);
                }}
                onKeyDown={(event) => {
                  const key = event.key.toLowerCase();
                  if (key === "n" || key === "b") {
                    event.preventDefault();
                    event.stopPropagation();
                    jumpDocsMatch(key === "n" ? "next" : "prev");
                  }
                }}
                placeholder="search docs…"
                className="h-full w-full bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground"
                aria-label="Search docs"
                inputMode="search"
              />
              <button
                type="submit"
                className="absolute right-1.5 inline-flex h-7 w-7 items-center justify-center border border-border text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Run search"
              >
                <Search className="h-3 w-3" />
              </button>
            </form>
            {searchQuery.trim() ? (
              <div
                className="pointer-events-none absolute right-0 top-[calc(100%+6px)] z-10 min-w-max border border-border/80 bg-background/95 px-2.5 py-1.5 font-mono text-[10px] lowercase text-muted-foreground shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm"
                aria-hidden="true"
              >
                <p className="flex items-center gap-1.5 whitespace-nowrap">
                  <span>{docsMatchIds.length} matches</span>
                  <span>•</span>
                  <kbd className="inline-flex h-5 min-w-[22px] items-center justify-center border border-border bg-secondary px-1 uppercase text-[10px]">n</kbd>
                  <span>next</span>
                  <kbd className="inline-flex h-5 min-w-[22px] items-center justify-center border border-border bg-secondary px-1 uppercase text-[10px]">b</kbd>
                  <span>prev</span>
                </p>
              </div>
            ) : null}
          </div>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-11 touch-manipulation items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
            aria-label="View on GitHub"
          >
            <Github className="h-4 w-4" aria-hidden="true" />
          </a>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex h-11 w-11 touch-manipulation items-center justify-center rounded border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-card/50 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation-menu"
          >
            <div className="relative size-4">
              <Menu
                className="absolute inset-0 size-4 transition-all duration-300"
                style={{
                  opacity: mobileOpen ? 0 : 1,
                  transform: mobileOpen ? 'rotate(90deg) scale(0.5)' : 'rotate(0) scale(1)',
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
              <X
                className="absolute inset-0 size-4 transition-all duration-300"
                style={{
                  opacity: mobileOpen ? 1 : 0,
                  transform: mobileOpen ? 'rotate(0) scale(1)' : 'rotate(-90deg) scale(0.5)',
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen ? (
        <div id="mobile-navigation-menu" className="md:hidden flex flex-col gap-2 border-t border-dashed border-border px-4 py-4">
          {anchorLinks.map((link) => (
            <a
              key={link.label}
              href={link.url}
              onClick={(event) => {
                if (
                  event.metaKey
                  || event.ctrlKey
                  || event.shiftKey
                  || event.altKey
                  || event.button !== 0
                ) {
                  return;
                }
                event.preventDefault();
                scrollToHash(link.url);
                setMobileOpen(false);
              }}
              className={[
                "inline-flex h-10 items-center border px-3 font-mono text-xs lowercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeHash === link.url
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              ].join(" ")}
              aria-current={activeHash === link.url ? "location" : undefined}
            >
              {link.label}
            </a>
          ))}
          {externalLinks.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-10 items-center border border-border px-3 font-mono text-xs lowercase text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </a>
          ))}
          <form
            className="relative mt-1 flex h-11 w-full touch-manipulation items-center border border-border bg-card/50 pl-8 pr-9 transition-colors hover:bg-card/80 focus-within:ring-1 focus-within:ring-primary"
            onSubmit={(event) => {
              event.preventDefault();
              runSearch(searchQuery);
              setMobileOpen(false);
            }}
          >
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <input
              id="docs-header-search-mobile"
              value={searchQuery}
              onChange={(event) => {
                const value = event.target.value;
                setSearchQuery(value);
                dispatchSearchQuery(value);
              }}
              onKeyDown={(event) => {
                const key = event.key.toLowerCase();
                if (key === "n" || key === "b") {
                  event.preventDefault();
                  event.stopPropagation();
                  jumpDocsMatch(key === "n" ? "next" : "prev");
                }
              }}
              className="h-full w-full bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="search docs…"
              aria-label="Search docs"
              inputMode="search"
            />
            <button
              type="submit"
              className="absolute right-1.5 inline-flex h-7 w-7 items-center justify-center border border-border text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Run search"
            >
              <Search className="h-3 w-3" />
            </button>
          </form>
          {searchQuery.trim() ? (
            <p className="mt-1 flex items-center gap-1.5 font-mono text-[10px] lowercase text-muted-foreground">
              <span>{docsMatchIds.length} matches</span>
              <span>•</span>
              <kbd className="inline-flex h-5 min-w-[22px] items-center justify-center border border-border bg-secondary px-1 uppercase">n</kbd>
              <span>next</span>
              <kbd className="inline-flex h-5 min-w-[22px] items-center justify-center border border-border bg-secondary px-1 uppercase">b</kbd>
              <span>prev</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </nav>
  );
}
