import { ReactNode, useEffect, useState } from "react";
import { useShortcut } from "@remcostoeten/use-shortcut";
import { useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "./Navbar";
import { InstallCommand } from "./InstallCommand";
import { DemoSection } from "./DemoSection";
import { BadgeBar } from "./BadgeBar";
import { ApiTable } from "./ApiTable";
import { CodeExamples } from "./CodeExamples";
import { CodeBlock } from "./CodeBlock";
import { ComponentRecipeBook } from "./ComponentRecipeBook";
import { PixelHeading } from "@/components/ui/pixel-heading";
import { FooterSection } from "./FooterSection";
import { ShowcaseSection } from "./ShowcaseSection";
import { ApiCapabilities } from "./ApiCapabilities";
import { ApiMethodMatrix } from "./ApiMethodMatrix";
import { DocsAssistantDialog } from "./DocsAssistantDialog";
import type { PackageConfig } from "@/config/types";
import { applySeoMeta } from "@/lib/seo";
import { applySoftwareStructuredData, applyWebsiteStructuredData } from "@/lib/structured-data";
import { trackDocsEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Props = {
  config: PackageConfig;
  demoContent?: ReactNode;
}

export function PackageShowcase({ config, demoContent }: Props) {
  const $ = useShortcut();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLeaving, setIsLeaving] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantRequest, setAssistantRequest] = useState<{
    query?: string;
    entryId?: string;
    source?: string;
    nonce: number;
  } | null>(null);

  const openAssistant = (request?: {
    query?: string;
    entryId?: string;
    source?: string;
  }) => {
    setAssistantRequest({
      query: request?.query,
      entryId: request?.entryId,
      source: request?.source ?? "unknown",
      nonce: Date.now(),
    });
    setAssistantOpen(true);
  };

  useEffect(() => {
    applySeoMeta({
      title: `${config.packageName} docs | ${config.description}`,
      description: `${config.packageName} - ${config.description}`,
      path: `/${config.slug}`,
    });
    if (config.slug === "use-shortcut") {
      applyWebsiteStructuredData();
      applySoftwareStructuredData();
    }
  }, [config.description, config.packageName, config.slug]);

  // Handle smooth navigation when clicking registry link
  const handleRegistryNavigation = () => {
    setIsLeaving(true);
    setTimeout(() => {
      navigate("/", { replace: true });
    }, 300);
  };

  useEffect(() => {
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [config.slug]);

  useEffect(() => {
    const registrations = (config.ctas ?? [])
      .filter((cta) => Boolean(cta.shortcutKey))
      .map((cta) =>
        $.key(cta.shortcutKey as Parameters<typeof $.key>[0]).on(() => {
          trackDocsEvent("cta_shortcut_triggered", {
            label: cta.label,
            href: cta.url,
            shortcutKey: cta.shortcutKey,
          });
          if (cta.url.startsWith("#")) {
            document.querySelector(cta.url)?.scrollIntoView({ behavior: "smooth" });
          } else {
            window.open(cta.url, "_blank");
          }
        })
      );

    return () => {
      registrations.forEach((item) => item.unbind());
    };
  }, [$, config.ctas]);

  useEffect(() => {
    const registration = $.mod.key("k").on(() => {
      setAssistantRequest({
        source: "shortcut",
        nonce: Date.now(),
      });
      setAssistantOpen(true);
    }, { preventDefault: true });

    return () => {
      registration.unbind();
    };
  }, [$]);

  return (
    <div className="min-h-screen bg-background relative overflow-x-clip">
      <div className={isLeaving ? "animate-fade-out-up" : "animate-fade-down"}>
        <Navbar navLinks={config.navLinks} currentSlug={config.slug} onRegistryClick={handleRegistryNavigation} />
      </div>

      <main id="main-content" className="mx-auto max-w-2xl border-x border-border min-h-screen relative z-10">
        <header
          id="overview"
          data-doc-search-scope="true"
          data-search-label="overview"
          className={cn(
            "border-b border-border px-4 pb-8 pt-6 sm:px-8 sm:pb-10 sm:pt-8",
            isLeaving ? "animate-fade-out-down" : "animate-fade-up"
          )}
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:justify-between">
              <div className="min-w-0">
                <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", !isLeaving && "animate-fade-up stagger-1")}>
                  {config.tagline ? (
                    config.tagline.startsWith("@") ? (
                      <a
                        href={config.author.url}
                        className="inline-flex items-center font-mono text-xs text-primary/85 transition-colors hover:text-primary"
                      >
                        [{config.tagline}]
                      </a>
                    ) : (
                      <p className="font-mono text-xs text-primary">
                        [{config.tagline}]
                      </p>
                    )
                  ) : null}
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground/55">
                    react package
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground/45">
                    {(config.author.handle.startsWith("@") ? config.author.handle : `@${config.author.handle}`)}
                  </span>
                </div>

                <div className={!isLeaving ? "animate-fade-up stagger-2" : undefined}>
                  <PixelHeading
                    as="h1"
                    mode="wave"
                    autoPlay
                    cycleInterval={250}
                    staggerDelay={60}
                    initialFont="square"
                    className="mt-4 text-3xl font-bold lowercase tracking-tight text-foreground sm:text-4xl leading-[1.02]"
                  >
                    {config.heroTitle}
                  </PixelHeading>
                </div>

                <p className={cn(
                  "mt-4 max-w-xl text-sm lowercase leading-relaxed text-muted-foreground",
                  !isLeaving && "animate-fade-up stagger-3"
                )}>
                  {config.description}
                </p>
                {config.heroSubcopy ? (
                  <p className={cn(
                    "mt-2 max-w-xl text-xs lowercase leading-relaxed text-muted-foreground/80",
                    !isLeaving && "animate-fade-up stagger-4"
                  )}>
                    {config.heroSubcopy}
                  </p>
                ) : null}
              </div>

              <div className={!isLeaving ? "animate-fade-up stagger-4" : undefined}>
                <BadgeBar
                  installName={config.installName}
                  npmUrl={config.links.npm}
                  githubUrl={config.links.github}
                  bundleSizeKb={config.bundleSizeKb}
                  variant="hero"
                  alignEnd={false}
                  className="max-w-full"
                />
              </div>
            </div>

            <div className="grid gap-4 mt-8">
              <div className="border border-border bg-card/24 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-primary">[search-docs]</p>
                    <p className="mt-1 max-w-md text-xs lowercase leading-relaxed text-muted-foreground text-balance">
                      the-docs-assistant-is-bound-globally-press-mod+k-anywhere-on-the-page-to-open-it.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAssistant({ source: "hero" })}
                    className="flex min-w-[200px] min-h-11 items-center justify-center gap-2 border border-border bg-background/80 px-3 font-mono text-[11px] lowercase text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    open-docs-assistant
                    <kbd className="flex min-h-6 items-center justify-center border border-border bg-card/70 px-2 font-mono text-[10px] uppercase text-muted-foreground">
                      <span>⌘</span>
                      <span className="ml-1">K</span>
                    </kbd>
                  </button>
                </div>

                <div className="mt-4">
                  <CodeBlock
                    title={config.slug === "use-shortcut" ? "shortcut-binding" : "next-js-setup"}
                    language="tsx"
                    code={config.slug === "use-shortcut"
                      ? `const $ = useShortcut()
$.mod.key("k").on(openSearch, { preventDefault: true })`
                      : `import { Analytics } from '@remcostoeten/analytics'

// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}`
                    }
                  />
                </div>
              </div>

              {config.ctas && config.ctas.length > 0 ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {config.ctas.map((cta) =>
                    cta.primary ? (
                      <a
                        key={cta.label}
                        href={cta.url}
                        onClick={() => {
                          trackDocsEvent("cta_clicked", {
                            label: cta.label,
                            href: cta.url,
                            primary: true,
                          });
                        }}
                        className="inline-flex min-h-9 items-center gap-2 border border-primary/40 bg-primary/12 px-3 py-2 font-mono text-[11px] font-medium text-primary transition-colors hover:bg-primary/18"
                      >
                        {cta.label}
                        {cta.shortcutKey ? (
                          <kbd className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-primary/30 bg-background/40 px-1 font-mono text-[10px] font-normal uppercase text-primary/80">
                            {cta.shortcutKey}
                          </kbd>
                        ) : null}
                      </a>
                    ) : (
                      <a
                        key={cta.label}
                        href={cta.url}
                        onClick={() => {
                          trackDocsEvent("cta_clicked", {
                            label: cta.label,
                            href: cta.url,
                            primary: false,
                          });
                        }}
                        className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {cta.label}
                        {cta.shortcutKey ? (
                          <kbd className="ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-border bg-muted px-1 font-mono text-[10px] font-normal uppercase text-muted-foreground">
                            {cta.shortcutKey}
                          </kbd>
                        ) : null}
                      </a>
                    )
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <section
          id="install"
          data-doc-search-scope="true"
          data-search-label="install"
          className="border-b border-border px-4 py-8 sm:px-8"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-primary">[install]</p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground lowercase">
                {config.slug === "use-shortcut"
                  ? "pick a package manager and copy the command. helper files stay right below it."
                  : "pick a package manager and copy the command."
                }
              </p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/45">
              start here
            </span>
          </div>
          {config.slug === "use-shortcut" ? (
            <InstallCommand packageName={config.installName} />
          ) : (
            <div className="w-full space-y-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "npm", label: "npm", cmd: `npm i ${config.installName}` },
                  { id: "yarn", label: "yarn", cmd: `yarn add ${config.installName}` },
                  { id: "pnpm", label: "pnpm", cmd: `pnpm add ${config.installName}` },
                  { id: "bun", label: "bun", cmd: `bun add ${config.installName}` },
                ].map((manager) => (
                  <button
                    key={manager.id}
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(manager.cmd);
                    }}
                    className="inline-flex min-h-9 items-center gap-2 rounded-sm border border-border bg-background px-3 text-xs text-foreground transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="font-mono">{manager.cmd}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-0 ">
          {demoContent ? (
            <ShowcaseSection id="demo" data-doc-search-scope="true" data-search-label="demo">
              <div className="mb-1">
                <p className="mb-1.5 font-mono text-xs text-primary">[example]</p>
                <p className="max-w-md text-xs leading-relaxed text-muted-foreground lowercase">
                  press the shortcuts below. each combo highlights the matching code in place.
                </p>
              </div>
              <DemoSection>{demoContent}</DemoSection>
            </ShowcaseSection>
          ) : null}

          {config.codeExamples && config.codeExamples.length > 0 && (
            <div id="syntax" data-doc-search-scope="true" data-search-label="syntax" className="px-4 py-8 sm:px-8">
              <div className="mb-6">
                <p className="font-mono text-xs text-primary mb-1.5">[recipes]</p>
                <h2 className="font-display text-base font-bold lowercase tracking-tight text-foreground mb-1.5">
                  copy-ready examples
                </h2>
                <p className="text-xs text-muted-foreground lowercase leading-relaxed max-w-md">
                  common patterns for app shortcuts, scopes, parsing, and custom keybinds.
                </p>
              </div>
              <CodeExamples examples={config.codeExamples} uiUseCases={config.uiUseCases} />
            </div>
          )}

          {config.componentRecipes && config.componentRecipes.length > 0 && (
            <div
              id="components"
              data-doc-search-scope="true"
              data-search-label="component recipes"
              className="border-y border-dashed border-border -mx-[1px] bg-card/24 px-4 py-8 sm:px-8"
            >
              <div className="mb-6">
                <p className="font-mono text-xs text-primary mb-1.5">[components]</p>
                <h2 className="font-display text-base font-bold lowercase tracking-tight text-foreground mb-1.5">
                  copy-ready component recipes
                </h2>
                <p className="text-xs text-muted-foreground lowercase leading-relaxed max-w-md">
                  complete components with shortcuts wired in so people can copy the whole thing and adapt it later.
                </p>
              </div>
              <ComponentRecipeBook recipes={config.componentRecipes} />
            </div>
          )}

          {config.apiProps && config.apiProps.length > 0 && (
            <div id="api" data-doc-search-scope="true" data-search-label="api options" className="border-y border-dashed border-border -mx-[1px] bg-card/30 px-4 py-8 sm:px-8">
              <ApiTable
                props={config.apiProps}
                guidance={config.apiPropGuidance}
                onAskProp={(propName) => {
                  openAssistant({
                    query: `when should i use ${propName}?`,
                    entryId: `prop:${propName}`,
                    source: "api-table",
                  });
                }}
              />
            </div>
          )}

          {config.apiCapabilities && config.apiCapabilities.length > 0 && (
            <div id="api-reference" data-doc-search-scope="true" data-search-label="api reference" className="px-4 py-8 sm:px-8">
              <div className="mb-6">
                <p className="font-mono text-xs text-primary mb-1.5">[api]</p>
                <h2 className="font-display text-base font-bold lowercase tracking-tight text-foreground mb-1.5">
                  exports at a glance
                </h2>
                <p className="text-xs text-muted-foreground lowercase leading-relaxed max-w-md">
                  what each export does and when to reach for it.
                </p>
              </div>
              <ApiCapabilities capabilities={config.apiCapabilities} />
            </div>
          )}

          {config.apiMethodGroups && config.apiOptionGroups && (
            <div id="api-matrix" data-doc-search-scope="true" data-search-label="api matrix" className="border-y border-dashed border-border -mx-[1px] bg-card/30 px-4 py-8 sm:px-8">
              <div className="mb-6">
                <p className="font-mono text-xs text-primary mb-1.5">[full api]</p>
                <h2 className="font-display text-base font-bold lowercase tracking-tight text-foreground mb-1.5">
                  every method and option
                </h2>
                <p className="text-xs text-muted-foreground lowercase leading-relaxed max-w-md">
                  full signatures and option keys for deeper implementation work.
                </p>
              </div>
              <ApiMethodMatrix methodGroups={config.apiMethodGroups} optionGroups={config.apiOptionGroups} />
            </div>
          )}
          <div id="footer" data-doc-search-scope="true" data-search-label="footer" className="border-t border-dashed border-border px-6">
            <FooterSection
              author={config.author.name}
              authorUrl={config.author.url}
              npmUrl={config.links.npm}
              githubUrl={config.links.github}
              ctas={config.ctas}
            />
          </div>
        </div>
      </main>

      <DocsAssistantDialog
        config={config}
        open={assistantOpen}
        onOpenChange={setAssistantOpen}
        request={assistantRequest}
      />
    </div>
  );
}
