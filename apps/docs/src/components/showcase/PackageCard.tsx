import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { PackageConfig } from "@/config/types";
import { cn } from "@/lib/utils";
import { useNpmMeta } from "@/hooks/use-npm-stats";
import { useGitHubRepoUpdatedAt } from "@/hooks/use-github-repo-updated";

interface PackageCardProps {
  pkg: PackageConfig;
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

export function PackageCard({ pkg }: PackageCardProps) {
  const fullName = pkg.installName || pkg.packageName;
  const isScoped = fullName.startsWith("@") && fullName.includes("/");
  const scope = isScoped ? fullName.split("/")[0] : null;
  const shortName = isScoped ? fullName.split("/").slice(1).join("/") : fullName;
  const showTagline = Boolean(pkg.tagline && !pkg.tagline.startsWith("@"));
  const { version, lastPublishedAt, isLoading: isNpmLoading } = useNpmMeta(fullName);
  const { updatedAt: repoUpdatedAt, isLoading: isRepoLoading } = useGitHubRepoUpdatedAt(pkg.links.github);
  const updatedLabel = repoUpdatedAt ?? lastPublishedAt;
  const isUpdatedLoading = (isRepoLoading && !repoUpdatedAt) && (isNpmLoading && !lastPublishedAt);

  return (
    <Link
      to={`/${pkg.slug}`}
      className={cn(
        "group relative flex items-start justify-between gap-4 overflow-hidden rounded-lg border border-border bg-gradient-to-b from-card/22 to-card/10 px-6 py-6 shadow-[0_1px_0_0_rgba(255,255,255,0.02)] transition-[transform,background-color,border-color,box-shadow] duration-300 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] will-change-transform",
        "after:pointer-events-none after:absolute after:inset-[10px] after:opacity-0 after:transition-opacity after:duration-300 after:[transition-timing-function:cubic-bezier(0.32,0.72,0,1)] after:content-[''] after:border after:border-dashed after:border-border/35",
        "hover:bg-card/20 hover:border-primary/40 hover:shadow-[0_10px_30px_-20px_rgba(0,0,0,0.8)] hover:after:opacity-100",
        "active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:after:opacity-100"
      )}
    >
      <div className="flex flex-col gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative h-4 w-4 shrink-0 text-primary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-full w-full"
            >
              {/* Main box outline */}
              <path
                d="M12 2l10 5v10l-10 5-10-5V7l10-5z"
                className="transition-all duration-500 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] group-hover:stroke-primary/80"
              />
              {/* Vertical center line */}
              <path
                d="M12 22V12"
                className="transition-transform duration-500 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] group-hover:translate-y-0.5"
              />
              {/* Top lid left */}
              <path
                d="M22 7l-10 5-10-5"
                className="transition-transform duration-500 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5"
              />
              {/* Interior line left */}
              <path
                d="M16 4.5L6 9.5"
                className="opacity-40 transition-all duration-500 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:opacity-100"
              />
            </svg>
          </div>
          <span className="font-mono text-sm font-bold lowercase truncate">
            {scope ? (
              <>
                <span className="text-muted-foreground/70">{scope}</span>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-foreground">{shortName}</span>
              </>
            ) : (
              <span className="text-foreground">{shortName}</span>
            )}
          </span>
          {showTagline ? (
            <span className="font-mono text-[10px] text-muted-foreground/60 hidden sm:inline truncate">
              [{pkg.tagline}]
            </span>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground lowercase leading-relaxed line-clamp-2 max-w-md">
          {pkg.description}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground tabular-nums">
          <span className="inline-flex min-h-6 items-center rounded border border-border/80 bg-card/40 px-2">
            {isNpmLoading ? (
              <span className="inline-block h-3 w-12 animate-pulse rounded bg-muted-foreground/20" />
            ) : version ? (
              <>v{version}</>
            ) : (
              "v—"
            )}
          </span>
          <span className="inline-flex min-h-6 items-center rounded border border-dashed border-border/70 bg-card/30 px-2">
            {isUpdatedLoading ? (
              <span className="inline-block h-3 w-24 animate-pulse rounded bg-muted-foreground/20" />
            ) : updatedLabel ? (
              <>updated {formatCompactDate(updatedLabel)}</>
            ) : (
              "updated —"
            )}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-center mt-0.5">
        <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-[transform,color] duration-300 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:text-primary will-change-transform" />
      </div>
    </Link>
  );
}
