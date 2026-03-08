import { Navigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { packages } from "@/config/registry";
import { ArrowRight, Package } from "lucide-react";
import { applySeoMeta } from "@/lib/seo";
import { PixelHeading } from "@/components/ui/pixel-heading";

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
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl flex items-center px-8 h-12">
          <span className="font-mono text-sm font-bold lowercase tracking-wide text-foreground">
            packages
          </span>
        </div>
      </nav>

      <main id="main-content" className="mx-auto max-w-2xl border-x border-border min-h-screen">
        <header className="border-b border-border px-8 pt-12 pb-8">
          <p className="font-mono text-xs text-primary mb-4">
            [package registry]
          </p>
          <PixelHeading
            as="h1"
            mode="wave"
            autoPlay
            cycleInterval={250}
            staggerDelay={60}
            initialFont="square"
            className="text-3xl font-bold lowercase tracking-tight text-foreground sm:text-4xl leading-[1.1] mb-4"
          >
            @remcostoeten
          </PixelHeading>
          <p className="text-sm leading-relaxed text-muted-foreground lowercase max-w-lg">
            open-source-packages-for-react-ecosystem.
          </p>
        </header>

        <div className="flex flex-col">
          {packages.map((pkg) => (
            <Link
              key={pkg.slug}
              to={`/${pkg.slug}`}
              className="group flex items-start justify-between gap-4 border-b border-dashed border-border px-8 py-6 transition-colors hover:bg-card/40"
            >
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="font-mono text-sm font-bold text-foreground lowercase truncate">
                    {pkg.packageName}
                  </span>
                  {pkg.tagline && (
                    <span className="font-mono text-[10px] text-muted-foreground/60 hidden sm:inline">
                      [{pkg.tagline}]
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground lowercase leading-relaxed line-clamp-2">
                  {pkg.description}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground shrink-0 mt-1 transition-colors" />
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
