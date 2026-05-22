import { Link } from "react-router-dom";
import { ArrowRight, Boxes, Package2, TerminalSquare } from "lucide-react";
import type { RegistryItem } from "@/config/types";
import { isAbsoluteUrl } from "@/config/site";
import { cn } from "@/lib/utils";
import { useNpmMeta } from "@/hooks/use-npm-stats";
import { useGitHubRepoUpdatedAt } from "@/hooks/use-github-repo-updated";

interface RegistryCardProps {
  item: RegistryItem;
}

function formatCompactDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function RegistryGlyph({ kind }: { kind: RegistryItem["kind"] }) {
  if (kind === "cli") {
    return <TerminalSquare className="h-4 w-4" aria-hidden="true" />;
  }

  if (kind === "extension") {
    return <Boxes className="h-4 w-4" aria-hidden="true" />;
  }

  return <Package2 className="h-4 w-4" aria-hidden="true" />;
}

export function RegistryCard({ item }: RegistryCardProps) {
  const { version, isLoading: isNpmLoading } = useNpmMeta(item.npmPackageName ?? "");
  const { updatedAt: repoUpdatedAt, isLoading: isRepoLoading } = useGitHubRepoUpdatedAt(item.githubUrl);
  const updatedLabel = repoUpdatedAt;
  const isUpdatedLoading = item.status === "live" && Boolean(item.githubUrl) && !updatedLabel && isRepoLoading;
  const isClickable = Boolean(item.href);
  const isExternal = item.href ? isAbsoluteUrl(item.href) : false;

  const body = (
    <>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border/80 bg-card/55 text-primary">
            <RegistryGlyph kind={item.kind} />
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="truncate font-mono text-sm font-bold lowercase text-foreground">
                {item.title}
              </span>
              {item.tagline ? (
                <span className="hidden truncate font-mono text-[10px] text-muted-foreground/60 sm:inline">
                  [{item.tagline}]
                </span>
              ) : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
              <span>{item.label}</span>
              <span className="text-muted-foreground/30">•</span>
              <span>{item.status === "live" ? "available-now" : "upcoming"}</span>
            </div>
          </div>
        </div>

        <p className="max-w-md text-xs lowercase leading-relaxed text-muted-foreground">
          {item.description}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground tabular-nums">
          {item.status === "live" && item.npmPackageName ? (
            <span className="inline-flex min-h-6 items-center border border-border/80 bg-card/40 px-2">
              {isNpmLoading ? (
                <span className="inline-block h-3 w-12 animate-pulse bg-muted-foreground/20" />
              ) : version ? (
                <>v{version}</>
              ) : (
                "live"
              )}
            </span>
          ) : null}

          <span className="inline-flex min-h-6 items-center border border-dashed border-border/70 bg-card/30 px-2">
            {item.status === "upcoming" ? (
              "planned"
            ) : isUpdatedLoading ? (
              <span className="inline-block h-3 w-24 animate-pulse bg-muted-foreground/20" />
            ) : updatedLabel ? (
              <>updated {formatCompactDate(updatedLabel)}</>
            ) : (
              "maintained"
            )}
          </span>
        </div>
      </div>

      <div className="mt-0.5 flex shrink-0 items-center justify-center">
        {isClickable ? (
          <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-[transform,color] duration-300 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:text-primary will-change-transform" />
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/45">
            soon
          </span>
        )}
      </div>
    </>
  );

  const className = cn(
    "group relative flex items-start justify-between gap-4 overflow-hidden border border-border px-6 py-6",
    "after:pointer-events-none after:absolute after:inset-[10px] after:opacity-0 after:transition-opacity after:duration-300 after:[transition-timing-function:cubic-bezier(0.32,0.72,0,1)] after:content-[''] after:border after:border-dashed after:border-border/35",
    isClickable
      ? "will-change-transform hover:border-primary/40 hover:bg-card/20 hover:after:opacity-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:after:opacity-100"
      : "border-border/80 bg-card/10",
  );

  if (isClickable && item.href) {
    if (isExternal) {
      return (
        <a href={item.href} className={className}>
          {body}
        </a>
      );
    }

    return (
      <Link to={item.href} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <article className={className}>
      {body}
    </article>
  );
}
