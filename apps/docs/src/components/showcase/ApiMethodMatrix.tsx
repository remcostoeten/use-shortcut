import { useState } from "react";
import type { ApiMethodGroup, ApiOptionGroup } from "@/config/types";
import { SyntaxHighlight } from "./SyntaxHighlight";

type Props = {
  methodGroups: ApiMethodGroup[];
  optionGroups: ApiOptionGroup[];
};

const INITIAL_VISIBLE_GROUPS = 3;

export function ApiMethodMatrix({ methodGroups, optionGroups }: Props) {
  const [showAllMethods, setShowAllMethods] = useState(false);
  const [showAllOptions, setShowAllOptions] = useState(false);

  const visibleMethodGroups = showAllMethods
    ? methodGroups
    : methodGroups.slice(0, INITIAL_VISIBLE_GROUPS);
  const visibleOptionGroups = showAllOptions
    ? optionGroups
    : optionGroups.slice(0, INITIAL_VISIBLE_GROUPS);

  const canCollapseMethods = methodGroups.length > INITIAL_VISIBLE_GROUPS;
  const canCollapseOptions = optionGroups.length > INITIAL_VISIBLE_GROUPS;

  return (
    <section aria-label="API method and option matrix" className="w-full space-y-8">
      <div>
        <h3 className="mb-2 font-display text-base font-bold lowercase tracking-tight text-foreground">method matrix</h3>
        <p className="mb-4 text-xs lowercase leading-relaxed text-muted-foreground">
          exhaustive callable surface across builder chains, registration handles, and utility functions.
        </p>

        <div className="relative">
          <div className="space-y-4">
            {visibleMethodGroups.map((group) => (
              <article key={group.title} className="border border-border bg-card/60">
                <header className="border-b border-dashed border-border px-3 py-2.5">
                  <h4 className="font-mono text-xs font-semibold lowercase text-primary">{group.title}</h4>
                  {group.description ? (
                    <p className="mt-1 text-xs lowercase text-muted-foreground">{group.description}</p>
                  ) : null}
                </header>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border bg-secondary/40">
                        <th className="px-3 py-2 font-mono text-[11px] lowercase text-muted-foreground">method</th>
                        <th className="px-3 py-2 font-mono text-[11px] lowercase text-muted-foreground">signature</th>
                        <th className="px-3 py-2 font-mono text-[11px] lowercase text-muted-foreground">what it does</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.methods.map((method) => (
                        <tr key={`${group.title}-${method.name}`} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 font-mono text-[11px] text-foreground">{method.name}</td>
                          <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground break-words [overflow-wrap:anywhere]">{method.signature}</td>
                          <td className="px-3 py-2 text-xs lowercase text-muted-foreground">{method.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
          {canCollapseMethods && !showAllMethods ? (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background via-background/94 to-transparent"
              aria-hidden="true"
            />
          ) : null}
        </div>

        {canCollapseMethods ? (
          <div className="mt-4 flex items-center justify-between gap-3 border border-dashed border-border bg-card/30 px-3 py-3">
            <p className="text-xs lowercase text-muted-foreground">
              showing {visibleMethodGroups.length} of {methodGroups.length} method groups.
            </p>
            <button
              type="button"
              onClick={() => setShowAllMethods((prev) => !prev)}
              className="inline-flex min-h-10 items-center border border-border px-3 font-mono text-[11px] lowercase text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-expanded={showAllMethods}
            >
              {showAllMethods ? "show less" : "show all"}
            </button>
          </div>
        ) : null}
      </div>

      <div>
        <h3 className="mb-2 font-display text-base font-bold lowercase tracking-tight text-foreground">option matrix</h3>
        <p className="mb-4 text-xs lowercase leading-relaxed text-muted-foreground">
          exhaustive config keys for hook-level, handler-level, and recording behavior.
        </p>

        <div className="relative">
          <div className="space-y-4">
            {visibleOptionGroups.map((group) => (
              <article key={group.title} className="border border-border bg-gradient-to-br from-card via-card to-card/70">
                <header className="border-b border-dashed border-border px-3 py-2.5">
                  <h4 className="font-mono text-xs font-semibold lowercase text-primary">{group.title}</h4>
                  {group.description ? (
                    <p className="mt-1 text-xs lowercase text-muted-foreground">{group.description}</p>
                  ) : null}
                </header>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border bg-secondary/40">
                        <th className="px-3 py-2 font-mono text-[11px] lowercase text-muted-foreground">option</th>
                        <th className="px-3 py-2 font-mono text-[11px] lowercase text-muted-foreground">type</th>
                        <th className="px-3 py-2 font-mono text-[11px] lowercase text-muted-foreground">default</th>
                        <th className="px-3 py-2 font-mono text-[11px] lowercase text-muted-foreground">what it does</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.options.map((option) => (
                        <tr key={`${group.title}-${option.name}`} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 font-mono text-[11px] text-foreground">{option.name}</td>
                          <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground break-words [overflow-wrap:anywhere]">{option.type}</td>
                          <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground break-words [overflow-wrap:anywhere]">{option.default ?? "—"}</td>
                          <td className="px-3 py-2 text-xs lowercase text-muted-foreground">{option.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {group.usageExample ? (
                  <div className="border-t border-dashed border-border p-3">
                    <p className="mb-1 font-mono text-[11px] lowercase text-primary">usage example</p>
                    <pre className="border border-border bg-background p-3 text-[11px] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                      <SyntaxHighlight code={group.usageExample} language={group.usageLanguage ?? "tsx"} />
                    </pre>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
          {canCollapseOptions && !showAllOptions ? (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background via-background/94 to-transparent"
              aria-hidden="true"
            />
          ) : null}
        </div>

        {canCollapseOptions ? (
          <div className="mt-4 flex items-center justify-between gap-3 border border-dashed border-border bg-card/30 px-3 py-3">
            <p className="text-xs lowercase text-muted-foreground">
              showing {visibleOptionGroups.length} of {optionGroups.length} option groups.
            </p>
            <button
              type="button"
              onClick={() => setShowAllOptions((prev) => !prev)}
              className="inline-flex min-h-10 items-center border border-border px-3 font-mono text-[11px] lowercase text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-expanded={showAllOptions}
            >
              {showAllOptions ? "show less" : "show all"}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
