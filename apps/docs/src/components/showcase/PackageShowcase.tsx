import { ReactNode, useEffect } from "react";
import { useShortcut } from "@remcostoeten/use-shortcut";
import { Navbar } from "./Navbar";
import { InstallCommand } from "./InstallCommand";
import { DemoSection } from "./DemoSection";

import { ApiTable } from "./ApiTable";
import { CodeExamples } from "./CodeExamples";
import { FooterSection } from "./FooterSection";
import { BadgeBar } from "./BadgeBar";
import { ShowcaseSection } from "./ShowcaseSection";
import { ApiCapabilities } from "./ApiCapabilities";
import { ApiMethodMatrix } from "./ApiMethodMatrix";
import { ApiPropGuidance } from "./ApiPropGuidance";
import { PixelHeading } from "@/components/ui/pixel-heading";
import type { PackageConfig } from "@/config/types";
import { ArrowRight } from "lucide-react";
import { applySeoMeta } from "@/lib/seo";
import { applySoftwareStructuredData, applyWebsiteStructuredData } from "@/lib/structured-data";

type Props = {
  config: PackageConfig;
  demoContent?: ReactNode;
  canonicalPath?: string;
}

export function PackageShowcase({ config, demoContent, canonicalPath = "/" }: Props) {
  const $ = useShortcut();

  useEffect(() => {
    applySeoMeta({
      title: `${config.packageName} docs | typed React keyboard shortcuts`,
      description: `${config.packageName} is a typed React keyboard shortcut library with combos, sequences, scopes, parser utilities, and shortcut recording.`,
      path: canonicalPath,
    });
    if (config.slug === "use-shortcut") {
      applyWebsiteStructuredData();
      applySoftwareStructuredData();
    }
  }, [canonicalPath, config.description, config.packageName, config.slug]);

  useEffect(() => {
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [config.slug]);

  useEffect(() => {
    const registrations = (config.ctas ?? [])
      .filter((cta) => Boolean(cta.shortcutKey))
      .map((cta) =>
        $.key(cta.shortcutKey as Parameters<typeof $.key>[0]).on(() => {
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

  return (
    <div className="min-h-screen bg-background relative overflow-x-clip">
      <Navbar
        packageName={config.packageName}
        navLinks={config.navLinks}
        githubUrl={config.links.github}
      />

      <div className="hidden lg:block pointer-events-none select-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-[320px] left-0 right-0 h-px bg-border/40" />
        <div className="absolute top-[320px] left-0 right-0 h-px border-t border-dashed border-border/30" style={{ top: "520px" }} />
        <div className="absolute left-0 right-0 h-px border-t border-dashed border-border/20" style={{ top: "780px" }} />
      </div>

      <main id="main-content" className="mx-auto max-w-2xl border-x border-border min-h-screen relative z-10">
        <header id="overview" data-doc-search-scope="true" data-search-label="overview" className="border-b border-border px-4 pb-5 pt-4 sm:px-8">
          <div className="flex">
            {config.tagline && (
              config.tagline.startsWith("@") ? (
                <a
                  href={config.author.url}
                  className="inline-flex translate-y-[6px] items-center font-mono text-sm text-primary/85 hover:text-primary transition-colors"
                >
                  {config.tagline}
                </a>
              ) : (
                <p className="font-mono text-xs text-primary mb-4">
                  [{config.tagline}]
                </p>
              )
            )}
          </div>

          <PixelHeading
            as="h1"
            mode="wave"
            autoPlay
            cycleInterval={250}
            staggerDelay={60}
            initialFont="square"
            className="text-3xl font-bold lowercase tracking-tight text-foreground sm:text-4xl leading-[1.1] mb-2"
          >
            {config.heroTitle}
          </PixelHeading>

          <p className="text-sm leading-relaxed text-muted-foreground lowercase max-w-lg">
            {config.description}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground/80 lowercase max-w-xl">
            install it, try the shortcuts, then copy the pattern you need.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <BadgeBar
              installName={config.installName}
              npmUrl={config.links.npm}
              githubUrl={config.links.github}
              bundleSizeKb={config.bundleSizeKb}
              variant="hero"
              alignEnd={false}
              className="max-w-full"
            />

            {config.ctas && config.ctas.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {config.ctas.map((cta) =>
                cta.primary ? (
                  <a
                    key={cta.label}
                    href={cta.url}
                    className="inline-flex min-h-9 items-center gap-2 border border-primary/40 bg-primary/12 px-3 py-2 font-mono text-[11px] font-medium text-primary hover:bg-primary/18 transition-colors"
                  >
                    {cta.label}
                    {cta.shortcutKey && (
                      <kbd className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-primary/30 bg-background/40 px-1 font-mono text-[10px] font-normal uppercase text-primary/80">
                        {cta.shortcutKey}
                      </kbd>
                    )}
                  </a>
                ) : (
                  <a
                    key={cta.label}
                    href={cta.url}
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {cta.label}
                    {cta.shortcutKey && (
                      <kbd className="ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-border bg-muted px-1 font-mono text-[10px] font-normal uppercase text-muted-foreground">
                        {cta.shortcutKey}
                      </kbd>
                    )}
                    <ArrowRight className="h-3 w-3" />
                  </a>
                )
              )}
              </div>
            )}
          </div>
        </header>

        <div className="flex flex-col gap-0">
          <ShowcaseSection id="install" data-doc-search-scope="true" data-search-label="install">
            <InstallCommand packageName={config.installName} />
            {demoContent ? (
              <div id="demo" data-doc-search-scope="true" data-search-label="demo" className="border-t border-dashed border-border pt-6">
                <div className="mb-5">
                  <p className="font-mono text-xs text-primary mb-1.5">[test it]</p>
                  <p className="text-xs text-muted-foreground lowercase leading-relaxed max-w-md">
                    press the shortcuts below. each combo highlights the matching code.
                  </p>
                </div>
                <DemoSection>{demoContent}</DemoSection>
              </div>
            ) : null}
          </ShowcaseSection>

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

          {config.apiProps && config.apiProps.length > 0 && (
            <div id="api" data-doc-search-scope="true" data-search-label="api options" className="border-y border-dashed border-border -mx-[1px] bg-card/30 px-4 py-8 sm:px-8">
              <ApiTable props={config.apiProps} />
              {config.apiPropGuidance && config.apiPropGuidance.length > 0 ? (
                <div className="mt-4">
                  <ApiPropGuidance items={config.apiPropGuidance} />
                </div>
              ) : null}
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



          <div id="footer" data-doc-search-scope="true" data-search-label="footer" className="border-t border-dashed border-border px-4 sm:px-8">
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
    </div>
  );
}
