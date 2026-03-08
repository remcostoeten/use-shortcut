import { useEffect, useMemo, useState } from "react";
import { Search, Github, Menu, X } from "lucide-react";
import type { NavLink as ShowcaseNavLink } from "@/config/types";
import { Link } from "react-router-dom";
import { trackDocsEvent } from "@/lib/analytics";
import { scrollToDocsSection } from "@/lib/docs-navigation";

interface NavbarProps {
  packageName: string;
  navLinks: ShowcaseNavLink[];
  githubUrl: string;
  onOpenAssistant: (source: string) => void;
}

export function Navbar({ packageName, navLinks, githubUrl, onOpenAssistant }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeHash, setActiveHash] = useState<string>("");

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
    setActiveHash(hash);
    return scrollToDocsSection(hash);
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

  return (
    <nav id="docs-navbar" className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          aria-label={`Back to ${packageName} registry`}
          className="whitespace-nowrap font-mono text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-primary"
        >
          [registry]
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
                trackDocsEvent("nav_anchor_clicked", {
                  label: link.label,
                  href: link.url,
                  location: "desktop",
                });
              }}
              className={[
                "inline-flex h-8 whitespace-nowrap items-center px-1.5 font-mono text-[11px] lowercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeHash === link.url
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
              aria-current={activeHash === link.url ? "location" : undefined}
            >
              [{link.label}]
            </a>
          ))}
          {externalLinks.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackDocsEvent("nav_external_clicked", {
                  label: link.label,
                  href: link.url,
                  location: "desktop",
                });
              }}
              className="inline-flex h-8 whitespace-nowrap items-center px-1.5 font-mono text-[11px] lowercase text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              [{link.label}]
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onOpenAssistant("navbar")}
            className="hidden min-h-11 min-w-[244px] touch-manipulation items-center justify-between gap-4 border border-border bg-card/55 px-3 transition-colors hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex"
            aria-label="Open docs assistant"
          >
            <span className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span className="font-mono text-xs lowercase text-muted-foreground">
                ask or search docs…
              </span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-6 min-w-[28px] items-center justify-center border border-border bg-background px-1 font-mono text-[10px] uppercase text-muted-foreground">
                ⌘
              </kbd>
              <kbd className="inline-flex h-6 min-w-[28px] items-center justify-center border border-border bg-background px-1 font-mono text-[10px] uppercase text-muted-foreground">
                k
              </kbd>
            </span>
          </button>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackDocsEvent("github_link_clicked", {
                href: githubUrl,
                location: "header",
              });
            }}
            className="inline-flex h-11 w-11 touch-manipulation items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
            aria-label="View on GitHub"
          >
            <Github className="h-4 w-4" aria-hidden="true" />
          </a>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => {
              const nextOpen = !mobileOpen;
              setMobileOpen(nextOpen);
              trackDocsEvent("mobile_menu_toggled", {
                open: nextOpen,
              });
            }}
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
                trackDocsEvent("nav_anchor_clicked", {
                  label: link.label,
                  href: link.url,
                  location: "mobile",
                });
              }}
              className={[
                "inline-flex min-h-11 items-center px-1 font-mono text-xs lowercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeHash === link.url
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
              aria-current={activeHash === link.url ? "location" : undefined}
            >
              [{link.label}]
            </a>
          ))}
          {externalLinks.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setMobileOpen(false);
                trackDocsEvent("nav_external_clicked", {
                  label: link.label,
                  href: link.url,
                  location: "mobile",
                });
              }}
              className="inline-flex min-h-11 items-center px-1 font-mono text-xs lowercase text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              [{link.label}]
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              onOpenAssistant("mobile-nav");
              setMobileOpen(false);
            }}
            className="mt-1 inline-flex min-h-11 w-full touch-manipulation items-center justify-between border border-border bg-card/50 px-3 text-left transition-colors hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Open docs assistant"
          >
            <span className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span className="font-mono text-sm lowercase text-muted-foreground">
                ask or search docs…
              </span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              grounded
            </span>
          </button>
        </div>
      ) : null}
    </nav>
  );
}
