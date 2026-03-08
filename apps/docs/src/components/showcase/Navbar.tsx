import { useEffect, useMemo, useState } from "react";
import { Github, Menu, X } from "lucide-react";
import type { NavLink as ShowcaseNavLink } from "@/config/types";
import { Link } from "react-router-dom";
import { trackDocsEvent } from "@/lib/analytics";
import { scrollToDocsSection } from "@/lib/docs-navigation";

interface NavbarProps {
  navLinks: ShowcaseNavLink[];
  githubUrl: string;
}

export function Navbar({ navLinks, githubUrl }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeHash, setActiveHash] = useState<string>("");
  const [isCompact, setIsCompact] = useState(false);

  const anchorLinks = useMemo(
    () => navLinks.filter((link) => link.url.startsWith("#")),
    [navLinks],
  );
  const externalLinks = useMemo(
    () => navLinks.filter((link) => !link.url.startsWith("#")),
    [navLinks],
  );
  const primaryDesktopLinks = useMemo(() => {
    const preferredOrder = ["setup", "example", "components", "options"];
    const picked = preferredOrder
      .map((label) => anchorLinks.find((link) => link.label === label))
      .filter((link): link is ShowcaseNavLink => Boolean(link));

    return picked.length > 0 ? picked : anchorLinks.slice(0, 4);
  }, [anchorLinks]);

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

  useEffect(() => {
    const handleScroll = () => {
      setIsCompact(window.scrollY > 16);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <nav
      id="docs-navbar"
      className="sticky top-0 z-50 border-b border-border bg-background/94 backdrop-blur-md transition-[background-color] duration-200"
    >
      <div className="mx-auto w-full max-w-2xl border-x border-border">
        <div
          className={`flex items-center justify-between gap-4 px-4 transition-[min-height,padding] duration-200 sm:px-8 ${
            isCompact ? "min-h-[48px] py-1.5" : "min-h-[68px] py-3"
          }`}
        >
          <div className={`flex min-w-0 items-center transition-[gap] duration-200 ${isCompact ? "gap-3 sm:gap-5" : "gap-4 sm:gap-6"}`}>
            <Link
              to="/"
              aria-label="Back to registry"
              className={`inline-flex shrink-0 items-center font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground transition-[color,min-height] duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isCompact ? "min-h-6" : "min-h-8"
              }`}
            >
              [registry]
            </Link>

            <div className="hidden min-w-0 items-center gap-1 lg:flex">
              {primaryDesktopLinks.map((link) => (
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
                    `inline-flex items-center whitespace-nowrap px-2.5 font-mono text-[11px] lowercase transition-[color,min-height] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isCompact ? "min-h-7" : "min-h-9"
                    }`,
                    activeHash === link.url
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                  aria-current={activeHash === link.url ? "location" : undefined}
                >
                  {link.label === "options" ? "api" : link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
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
              className={`hidden touch-manipulation items-center justify-center border border-border bg-card/40 text-muted-foreground transition-[color,border-color,min-height,min-width] duration-200 hover:border-primary/35 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex ${
                isCompact ? "min-h-9 min-w-9" : "min-h-11 min-w-11"
              }`}
              aria-label="View on GitHub"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
            </a>

            <button
              type="button"
              onClick={() => {
                const nextOpen = !mobileOpen;
                setMobileOpen(nextOpen);
                trackDocsEvent("mobile_menu_toggled", {
                  open: nextOpen,
                });
              }}
              className={`inline-flex touch-manipulation items-center justify-center border border-dashed border-border bg-card/30 text-muted-foreground transition-[color,border-color,min-height,min-width] duration-200 hover:border-primary/35 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden ${
                isCompact ? "min-h-9 min-w-9" : "min-h-11 min-w-11"
              }`}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation-menu"
            >
              <div className="relative size-4">
                <Menu
                  className="absolute inset-0 size-4 transition-all duration-300"
                  style={{
                    opacity: mobileOpen ? 0 : 1,
                    transform: mobileOpen ? "rotate(90deg) scale(0.5)" : "rotate(0) scale(1)",
                    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
                <X
                  className="absolute inset-0 size-4 transition-all duration-300"
                  style={{
                    opacity: mobileOpen ? 1 : 0,
                    transform: mobileOpen ? "rotate(0) scale(1)" : "rotate(-90deg) scale(0.5)",
                    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <div
          id="mobile-navigation-menu"
          className="border-t border-dashed border-border md:hidden"
        >
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 border-x border-border px-4 py-4 sm:px-8">
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setMobileOpen(false);
                trackDocsEvent("github_link_clicked", {
                  href: githubUrl,
                  location: "mobile-menu",
                });
              }}
              className="inline-flex min-h-11 items-center justify-between border border-border bg-card/40 px-3 font-mono text-xs lowercase text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>github</span>
              <Github className="h-4 w-4" aria-hidden="true" />
            </a>
            <div className="grid gap-1">
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
                    "inline-flex min-h-11 items-center border border-transparent px-3 font-mono text-xs lowercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    activeHash === link.url
                      ? "border-primary/25 bg-primary/8 text-primary"
                      : "text-muted-foreground hover:border-border hover:bg-card/30 hover:text-foreground",
                  ].join(" ")}
                  aria-current={activeHash === link.url ? "location" : undefined}
                >
                  {link.label === "options" ? "api" : link.label}
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
                  className="inline-flex min-h-11 items-center border border-transparent px-3 font-mono text-xs lowercase text-muted-foreground transition-colors hover:border-border hover:bg-card/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
