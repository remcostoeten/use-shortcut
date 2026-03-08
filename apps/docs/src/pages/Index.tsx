import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import { packages } from "@/config/registry";
import { Package } from "lucide-react";
import { applySeoMeta } from "@/lib/seo";
import { PixelHeading } from "@/components/ui/pixel-heading";
import { Navbar } from "@/components/showcase/Navbar";
import { PackageCard } from "@/components/showcase/PackageCard";

export default function Index() {
  useEffect(() => {
    applySeoMeta({
      title: "use-shortcut-registry",
      description: "registry-landing-page-for-remco-stoeten-packages.",
      path: "/",
      noIndex: true,
    });
  }, []);

  if (packages.length === 1) {
    return <Navigate to={`/${packages[0].slug}`} replace />;
  }

  if (packages.length === 0) {
    return (
      <main
        id="main-content"
        className="min-h-screen bg-background border-x border-border max-w-2xl mx-auto flex flex-col items-center justify-center p-8"
      >
        <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-bold tracking-tight mb-2">no-packages-published-yet</h2>
        <p className="text-muted-foreground text-sm text-center max-w-[250px]">
          there-are-currently-no-packages-available-in-registry.
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-clip">
      <main id="main-content" className="mx-auto max-w-2xl border-x border-border min-h-screen relative z-10">
        <header className="border-b border-border px-4 pb-8 pt-6 sm:px-8 sm:pb-10 sm:pt-8">
          <div className="flex flex-col gap-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="font-mono text-xs text-primary/85">
                  [package registry]
                </p>
                <span className="font-mono text-tiny uppercase tracking-[0.24em] text-muted-foreground/55">
                  @remcostoeten
                </span>
                <span className="font-mono text-tiny uppercase tracking-[0.24em] text-muted-foreground/55">
                  react packages
                </span>
                <span className="font-mono text-tiny uppercase tracking-[0.24em] text-muted-foreground/45">
                  {packages.length}-packages
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
                a curated set of react packages with real-world docs, examples, and copyable patterns.
              </p>
              <p className="mt-2 max-w-xl text-xs lowercase leading-relaxed text-muted-foreground/80">
                pick a package to get install steps, api reference, and practical recipes.
              </p>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-4 p-4 sm:p-8">
          <div className="grid gap-4">
            {packages.map((pkg) => (
              <PackageCard key={pkg.slug} pkg={pkg} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
