import { CodeBlock } from "./CodeBlock";
import type { UiUseCase } from "@/config/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Example {
  title: string;
  description?: string;
  code: string;
  language?: string;
}

interface CodeExamplesProps {
  examples?: Example[];
  uiUseCases?: UiUseCase[];
}

const defaultExamples: Example[] = [
  {
    title: "how to use with react?",
    code: `import { usePackage } from "package-name"

function App() {
  const result = usePackage({
    option: "value",
    enabled: true,
  })

  return <div>{result.output}</div>
}`,
  },
  {
    title: "need a different setup?",
    code: `import { createInstance } from "package-name"

const instance = createInstance({
  target: document.body,
  option: "value",
})

instance.enable()`,
  },
];

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function ExampleUseCase({ item }: { item: UiUseCase }) {
  return (
    <div className="mt-3 border border-border bg-card/40">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={item.id} className="border-border">
          <AccordionTrigger className="px-3 py-2.5 text-left hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="font-mono text-xs lowercase text-primary">real-world ui use case</span>
              <span className="text-xs leading-relaxed text-muted-foreground">{item.summary}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 px-3 pb-3">
            {item.whenToUse ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-mono text-[11px] lowercase text-primary">when to use:</span>{" "}
                {item.whenToUse}
              </p>
            ) : null}
            <div className="space-y-2">
              {item.actions.map((action) => (
                <div
                  key={`${item.id}-${action.label}`}
                  className="flex items-center justify-between gap-3 border border-border bg-background px-2.5 py-2"
                >
                  <span className="text-xs text-foreground">{action.label}</span>
                  <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center border border-border bg-muted px-1 font-mono text-[10px] text-muted-foreground">
                    {action.shortcut}
                  </kbd>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export function CodeExamples({ examples = defaultExamples, uiUseCases = [] }: CodeExamplesProps) {
  return (
    <div className="flex flex-col gap-8 w-full">
      {examples.map((ex) => (
        <article key={ex.title} className="space-y-2">
          <div>
            <h3 className="font-display text-base font-bold tracking-tight text-foreground">
              {ex.title}
            </h3>
            {ex.description ? (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {ex.description}
              </p>
            ) : null}
          </div>
          <CodeBlock code={ex.code} language={ex.language} />
          {(() => {
            const match = uiUseCases.find((item) => normalize(item.title) === normalize(ex.title));
            return match ? <ExampleUseCase item={match} /> : null;
          })()}
        </article>
      ))}
    </div>
  );
}
