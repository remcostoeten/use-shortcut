import { ExternalLink } from "lucide-react";
import { useNpmStats } from "@/hooks/use-npm-stats";
import { cn } from "@/lib/utils";

function formatDownloads(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}m/wk`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k/wk`;
  return `${n}/wk`;
}

interface BadgeBarProps {
  installName?: string;
  primaryLabel?: string;
  primaryUrl?: string;
  primaryValue?: string | null;
  secondaryValue?: string | null;
  npmUrl?: string;
  githubUrl?: string;
  bundleSizeKb?: number;
  className?: string;
  alignEnd?: boolean;
  variant?: "default" | "hero";
}

export function BadgeBar({
  installName,
  primaryLabel = "npm",
  primaryUrl,
  primaryValue,
  secondaryValue,
  npmUrl = "#",
  githubUrl = "#",
  bundleSizeKb,
  className,
  alignEnd = true,
  variant = "default",
}: BadgeBarProps) {
  const shouldLoadNpmStats = Boolean(installName);
  const { version, weeklyDownloads, isLoading } = useNpmStats(installName);

  const skeletonClass =
    "inline-block h-3 w-10 animate-pulse rounded bg-muted-foreground/20";
  const hero = variant === "hero";
  const itemClassName = hero
    ? "inline-flex min-h-8 items-center gap-1.5 rounded border border-border/80 bg-card/70 px-2.5 py-1.5 font-mono text-[10px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
    : "inline-flex items-center gap-1.5 rounded border border-dashed border-border px-2.5 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground";
  const resolvedPrimaryUrl = primaryUrl ?? npmUrl;
  const resolvedPrimaryValue = shouldLoadNpmStats
    ? isLoading
      ? null
      : version
        ? `v${version}`
        : "live"
    : primaryValue;
  const resolvedSecondaryValue = shouldLoadNpmStats
    ? isLoading
      ? null
      : weeklyDownloads !== null
        ? formatDownloads(weeklyDownloads)
        : "—"
    : secondaryValue;

  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      <a
        href={resolvedPrimaryUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={itemClassName}
      >
        {primaryLabel}
        {resolvedPrimaryValue === null ? (
          <span className={skeletonClass} />
        ) : (
          <span className="text-primary">{resolvedPrimaryValue}</span>
        )}
      </a>

      {resolvedSecondaryValue ? (
        <span className={cn(itemClassName, "hover:border-border hover:text-muted-foreground")}>
          {resolvedSecondaryValue}
        </span>
      ) : null}

      {bundleSizeKb && (
        <span className={cn(itemClassName, "hover:border-border hover:text-muted-foreground")}>
          ~{bundleSizeKb}kb
        </span>
      )}

      <a
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(itemClassName, alignEnd && "ml-auto")}
      >
        github
        <ExternalLink className="h-2.5 w-2.5" />
      </a>
    </div>
  );
}
