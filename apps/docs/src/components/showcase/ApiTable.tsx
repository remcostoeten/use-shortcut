import type { ApiProp, ApiPropGuidance } from "@/config/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SyntaxHighlight } from "./SyntaxHighlight";

interface ApiTableProps {
  title?: string;
  props?: ApiProp[];
  guidance?: ApiPropGuidance[];
  onAskProp?: (propName: string) => void;
}

const defaultProps: ApiProp[] = [
  { name: "option", type: "string", default: '""', description: "placeholder option description." },
  { name: "enabled", type: "boolean", default: "true", description: "whether the feature is enabled." },
  { name: "delay", type: "number", default: "0", description: "delay in ms before action triggers." },
  { name: "callback", type: "(value: T) => void", default: "—", description: "callback on completion." },
  { name: "target", type: "HTMLElement | null", default: "document", description: "dom element to attach to." },
];

export function ApiTable({
  title = "props",
  props = defaultProps,
  guidance = [],
  onAskProp,
}: ApiTableProps) {
  const guidanceByProp = new Map(guidance.map((item) => [item.prop, item]));

  return (
    <div className="w-full">
      <h2 className="mb-4 font-display text-base font-bold lowercase text-foreground">
        {title}
      </h2>

      <div className="overflow-hidden border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-3 py-2.5 font-mono text-xs font-medium lowercase text-muted-foreground">name</th>
              <th className="px-3 py-2.5 font-mono text-xs font-medium lowercase text-muted-foreground">type</th>
              <th className="hidden px-3 py-2.5 font-mono text-xs font-medium lowercase text-muted-foreground sm:table-cell">default</th>
              <th className="px-3 py-2.5 font-mono text-xs font-medium lowercase text-muted-foreground">description</th>
            </tr>
          </thead>
          <tbody>
            {props.map((prop) => {
              const detail = guidanceByProp.get(prop.name);

              return (
                <tr key={prop.name} className="border-b border-border last:border-0 align-top">
                  <td className="px-3 py-2.5 font-mono text-xs font-semibold text-primary">{prop.name}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground break-words [overflow-wrap:anywhere]">{prop.type}</td>
                  <td className="hidden px-3 py-2.5 font-mono text-xs text-muted-foreground sm:table-cell">{prop.default || "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    <div className="space-y-2">
                      <p>{prop.description}</p>
                      {detail ? (
                        <Accordion type="multiple" className="w-full">
                          <AccordionItem value={`${prop.name}-guidance`} className="border-border/60">
                            <AccordionTrigger className="py-1 font-mono text-[11px] lowercase text-primary hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                              <span>usage notes</span>
                            </AccordionTrigger>
                            <AccordionContent className="pb-1 pt-1">
                              <div className="space-y-3 border border-dashed border-border/80 bg-card/30 p-3">
                                <p className="text-xs lowercase leading-relaxed text-muted-foreground">
                                  {detail.guidance}
                                </p>
                                {detail.whenToUse ? (
                                  <p className="text-xs lowercase leading-relaxed text-muted-foreground">
                                    <span className="font-mono text-[11px] text-primary">when to use:</span>{" "}
                                    {detail.whenToUse}
                                  </p>
                                ) : null}
                                {detail.example ? (
                                  <div>
                                    <p className="mb-1 font-mono text-[11px] lowercase text-primary">example</p>
                                    <pre className="overflow-x-hidden border border-border bg-background p-3 text-[11px] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                                      <SyntaxHighlight code={detail.example} language={detail.exampleLanguage ?? "tsx"} />
                                    </pre>
                                  </div>
                                ) : null}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ) : null}
                      {onAskProp ? (
                        <button
                          type="button"
                          onClick={() => onAskProp(prop.name)}
                          className="inline-flex min-h-8 items-center border border-border bg-background px-2.5 font-mono text-[11px] lowercase text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`Ask about ${prop.name}`}
                        >
                          ask about {prop.name}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
