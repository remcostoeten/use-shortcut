import type { ApiPropGuidance as ApiPropGuidanceItem } from "@/config/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SyntaxHighlight } from "./SyntaxHighlight";

interface Props {
  title?: string;
  description?: string;
  items: ApiPropGuidanceItem[];
};

export function ApiPropGuidance({
  title = "prop guidance",
  description = "expand each prop for practical usage examples and implementation notes.",
  items,
}: Props) {
  if (!items.length) return null;

  return (
    <section aria-label="prop guidance" className="w-full border border-border bg-card/40">
      <div className="border-b border-dashed border-border px-3 py-2.5">
        <h3 className="font-display text-base font-bold lowercase text-foreground">
          {title}
        </h3>
        <p className="mt-1 text-xs lowercase leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      <Accordion type="multiple" className="w-full">
        {items.map((item) => (
          <AccordionItem key={item.prop} value={item.prop} className="border-border">
            <AccordionTrigger className="px-3 py-2.5 text-left hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="flex min-w-0 items-center gap-2">
                <span className="font-mono text-xs font-semibold text-primary">
                  {item.prop}
                </span>
                <span className="truncate text-xs lowercase text-muted-foreground">
                  {item.guidance}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 px-3 pb-3">
              <p className="text-xs lowercase leading-relaxed text-muted-foreground">
                {item.guidance}
              </p>

              {item.whenToUse ? (
                <p className="text-xs lowercase leading-relaxed text-muted-foreground">
                  <span className="font-mono text-[11px] text-primary">when to use:</span>{" "}
                  {item.whenToUse}
                </p>
              ) : null}

              {item.example ? (
                <div>
                  <p className="mb-1 font-mono text-[11px] lowercase text-primary">example</p>
                  <pre className="overflow-x-hidden border border-border bg-background p-3 text-[11px] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                    <SyntaxHighlight code={item.example} language={item.exampleLanguage ?? "tsx"} />
                  </pre>
                </div>
              ) : null}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
