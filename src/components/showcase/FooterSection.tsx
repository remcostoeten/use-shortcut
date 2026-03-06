interface FooterSectionProps {
  author?: string;
  authorUrl?: string;
  npmUrl?: string;
  githubUrl?: string;
  ctas?: Array<{
    label: string;
    url: string;
    shortcutKey?: string;
  }>;
}

export function FooterSection({
  author = "author",
  authorUrl = "#",
  npmUrl = "#",
  githubUrl = "#",
  ctas = [],
}: FooterSectionProps) {
  const shortcutHints = ctas.filter((cta) => Boolean(cta.shortcutKey));

  return (
    <div className="w-full py-4 sm:py-5">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-xs lowercase text-muted-foreground">
          made by{" "}
          <a href={authorUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {author}
          </a>
        </p>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] lowercase text-muted-foreground">
          <a href={npmUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
            npm
          </a>
          <span className="text-border">/</span>
          <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
            github
          </a>
          <span className="text-border">/</span>
          <a href="#main-content" className="hover:text-foreground transition-colors">
            back to top
          </a>
        </div>
      </div>

      {shortcutHints.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-border pt-3">
          <span className="font-mono text-[10px] lowercase tracking-wide text-muted-foreground/80">
            quick keys:
          </span>
          {shortcutHints.map((cta) => (
            <span key={`${cta.label}-${cta.shortcutKey}`} className="inline-flex items-center gap-1.5">
              <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-border bg-muted px-1 font-mono text-[10px] uppercase text-muted-foreground">
                {cta.shortcutKey}
              </kbd>
              <span className="font-mono text-[10px] lowercase text-muted-foreground">{cta.label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
