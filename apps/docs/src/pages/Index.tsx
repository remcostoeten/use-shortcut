import { useEffect } from "react";
import { Boxes, Package, TerminalSquare } from "lucide-react";
import { applySeoMeta } from "@/lib/seo";
import { PixelHeading } from "@/components/ui/pixel-heading";
import { Navbar } from "@/components/showcase/Navbar";
import { RegistryCard } from "@/components/showcase/RegistryCard";
import { registryItems } from "@/config/registry";

export default function Index() {
  useEffect(() => {
    applySeoMeta({
      title: "use-shortcut-registry",
      description: "registry-landing-page-for-remco-stoeten-packages.",
      path: "/",
      noIndex: true,
    });
  }, []);

  const liveItems = registryItems.filter((item) => item.status === "live");
  const upcomingItems = registryItems.filter((item) => item.status === "upcoming");

  if (registryItems.length === 0) {
    return (
      <main
        id="main-content"
        className="min-h-screen bg-background border-x border-border max-w-2xl mx-auto flex flex-col items-center justify-center p-8"
      >
        <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-bold tracking-tight mb-2">no-tools-published-yet</h2>
        <p className="text-muted-foreground text-sm text-center max-w-[250px]">
          there-are-currently-no-tools-available-in-the-registry.
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar navLinks={[]} className="animate-fade-down" />

      <div className="relative overflow-x-clip">
        <div className="hidden lg:block pointer-events-none select-none absolute inset-0" aria-hidden="true">
          <div className="absolute top-[320px] left-0 right-0 h-px bg-border/40" />
          <div className="absolute top-[320px] left-0 right-0 h-px border-t border-dashed border-border/30" style={{ top: "520px" }} />
          <div className="absolute left-0 right-0 h-px border-t border-dashed border-border/20" style={{ top: "780px" }} />
        </div>

        <main id="main-content" className="mx-auto max-w-2xl border-x border-border min-h-screen relative z-10">
        <header className="border-b border-border px-4 pb-8 pt-6 sm:px-8 sm:pb-10 sm:pt-8">
          <div className="flex flex-col gap-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="font-mono text-xs text-primary/85">
                  [tools registry]
                </p>
                <span className="font-mono text-tiny uppercase tracking-[0.24em] text-muted-foreground/55">
                  @remcostoeten
                </span>
                <span className="font-mono text-tiny uppercase tracking-[0.24em] text-muted-foreground/55">
                  packages • cli • extension
                </span>
                <span className="font-mono text-tiny uppercase tracking-[0.24em] text-muted-foreground/45">
                  {registryItems.length}-items
                </span>
              </div>
              <PixelHeading
                as="h1"
                mode="wave"
                autoPlay
                cycleInterval={250}
                staggerDelay={60}
                initialFont="square"
                className="mt-4 text-3xl font-bold lowercase tracking-tight text-foreground sm:text-4xl leading-[1.02]"
              >
                @remcostoeten
              </PixelHeading>
              <p className="mt-4 max-w-xl text-sm lowercase leading-relaxed text-muted-foreground">
                a growing catalog of product-facing tooling: react packages today, cli utilities next, and a general-purpose vscode extension in progress.
              </p>
              <p className="mt-2 max-w-xl text-xs lowercase leading-relaxed text-muted-foreground/80">
                the landing page now stays broad on purpose, while package docs keep their deeper install steps, api reference, and practical recipes.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="border border-border bg-card/24 p-4">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
                  <Package className="h-3.5 w-3.5" aria-hidden="true" />
                  live-now
                </div>
                <p className="mt-2 font-mono text-2xl text-foreground tabular-nums">{liveItems.length}</p>
                <p className="mt-1 text-xs lowercase leading-relaxed text-muted-foreground">documented packages and tools you can open right now.</p>
              </div>
              <div className="border border-border bg-card/24 p-4">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
                  <TerminalSquare className="h-3.5 w-3.5" aria-hidden="true" />
                  in-pipeline
                </div>
                <p className="mt-2 font-mono text-2xl text-foreground tabular-nums">{upcomingItems.filter((item) => item.kind === "cli").length}</p>
                <p className="mt-1 text-xs lowercase leading-relaxed text-muted-foreground">cli ideas reserved here so the registry can expand without another redesign.</p>
              </div>
              <div className="border border-border bg-card/24 p-4">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
                  <Boxes className="h-3.5 w-3.5" aria-hidden="true" />
                  editor
                </div>
                <p className="mt-2 font-mono text-2xl text-foreground tabular-nums">{upcomingItems.filter((item) => item.kind === "extension").length}</p>
                <p className="mt-1 text-xs lowercase leading-relaxed text-muted-foreground">a slot for the vscode extension and any follow-on editor tooling.</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-4 p-4 sm:p-8">
          <section aria-labelledby="shipping-now" className="grid gap-4">
            <div className="flex items-end justify-between gap-4 border-b border-dashed border-border/70 pb-3">
              <div>
                <p className="font-mono text-xs text-primary">[available-now]</p>
                <h2 id="shipping-now" className="mt-1 text-sm font-medium lowercase text-foreground">shipping today</h2>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">
                docs-ready
              </p>
            </div>
            <div className="grid gap-4">
              {liveItems.map((item) => (
                <RegistryCard key={item.id} item={item} />
              ))}
            </div>
          </section>

          <section aria-labelledby="coming-next" className="grid gap-4 pt-4">
            <div className="flex items-end justify-between gap-4 border-b border-dashed border-border/70 pb-3">
              <div>
                <p className="font-mono text-xs text-primary">[coming-next]</p>
                <h2 id="coming-next" className="mt-1 text-sm font-medium lowercase text-foreground">reserved for the next tooling wave</h2>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">
                roadmap-visible
              </p>
            </div>
            <div className="grid gap-4">
              {upcomingItems.map((item) => (
                <RegistryCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        </div>
      </main>
      </div>
    </div>
  );
}
