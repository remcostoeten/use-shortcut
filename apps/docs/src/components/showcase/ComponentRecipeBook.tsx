import { useEffect, useRef, useState, type ComponentType } from "react";
import { useShortcut } from "@remcostoeten/use-shortcut";
import { Copy, LogIn, LogOut, Sparkles, UserCircle2 } from "lucide-react";
import type { ComponentRecipe } from "@/config/types";
import { trackDocsEvent } from "@/lib/analytics";
import { CodeBlock } from "./CodeBlock";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ComponentRecipeBookProps {
  recipes: ComponentRecipe[];
}

interface RecipePreviewProps {
  recipe: ComponentRecipe;
}

function AvatarLoginRecipePreview({ recipe }: RecipePreviewProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCombo, setActiveCombo] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const $ = useShortcut();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const flashShortcut = (combo: string) => {
    setActiveCombo(combo);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => setActiveCombo(null), 900);
  };

  const triggerAction = (
    action: "login" | "logout",
    source: "button" | "shortcut",
    combo: "shift+l" | "shift+d",
  ) => {
    setMenuOpen(true);
    flashShortcut(combo);

    trackDocsEvent("component_recipe_triggered", {
      recipeId: recipe.id,
      action,
      source,
      combo: source === "shortcut" ? combo : undefined,
    });
  };

  $.shift.key("l").on(() => {
    triggerAction("login", "shortcut", "shift+l");
  }, { preventDefault: true });

  $.shift.key("d").on(() => {
    triggerAction("logout", "shortcut", "shift+d");
  }, { preventDefault: true });

  return (
    <div className="relative overflow-hidden border border-border bg-[radial-gradient(circle_at_top_right,rgba(255,98,0,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0)),linear-gradient(135deg,#0f0f0f,#050505)] p-3">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] opacity-30" aria-hidden="true" />

      <div className="relative">
        <div className="mb-2">
          <p className="font-mono text-[10px] lowercase text-primary">live preview</p>
          <p className="text-xs lowercase leading-relaxed text-muted-foreground">
            avatar trigger with keyboard shortcuts.
          </p>
        </div>

        <div className="relative min-h-[140px] border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              <span className="inline-flex min-h-6 items-center border border-primary/25 bg-primary/10 px-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-primary">
                menu
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground transition-colors hover:border-primary/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Open profile actions"
                aria-expanded={menuOpen}
              >
                <UserCircle2 className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            <kbd className={`inline-flex min-h-5 items-center justify-center border px-1.5 font-mono text-[9px] uppercase transition-colors ${activeCombo === "shift+l"
              ? "border-primary/50 bg-primary/12 text-primary"
              : "border-white/10 bg-white/5 text-muted-foreground"
              }`}>
              shift+l
            </kbd>
            <kbd className={`inline-flex min-h-5 items-center justify-center border px-1.5 font-mono text-[9px] uppercase transition-colors ${activeCombo === "shift+d"
              ? "border-primary/50 bg-primary/12 text-primary"
              : "border-white/10 bg-white/5 text-muted-foreground"
              }`}>
              shift+d
            </kbd>
          </div>

          <div
            className={`absolute right-3 top-[48px] w-[200px] origin-top-right border border-white/10 bg-[#0d0d0d] p-2 shadow-[0_20px_40px_rgba(0,0,0,0.45)] transition duration-200 ${menuOpen
              ? "translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-2 scale-[0.98] opacity-0"
              }`}
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-primary/85">
              profile
            </p>
            <button
              type="button"
              onClick={() => triggerAction("login", "button", "shift+l")}
              className="mt-2 inline-flex min-h-8 w-full items-center justify-between gap-2 border border-primary/35 bg-primary/10 px-2 text-left transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex items-center gap-1.5 text-xs lowercase text-primary">
                <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                login
              </span>
              <kbd className="inline-flex min-h-5 items-center justify-center border border-primary/25 bg-background/60 px-1 font-mono text-[9px] uppercase text-primary/80">
                shift+l
              </kbd>
            </button>
            <button
              type="button"
              onClick={() => triggerAction("logout", "button", "shift+d")}
              className="mt-1.5 inline-flex min-h-8 w-full items-center justify-between gap-2 border border-white/10 bg-white/5 px-2 text-left transition-colors hover:border-primary/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex items-center gap-1.5 text-xs lowercase text-foreground">
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                logout
              </span>
              <kbd className="inline-flex min-h-5 items-center justify-center border border-white/10 bg-background/60 px-1 font-mono text-[9px] uppercase text-muted-foreground">
                shift+d
              </kbd>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const recipePreviewRegistry: Record<string, ComponentType<RecipePreviewProps>> = {
  "avatar-login-trigger": AvatarLoginRecipePreview,
};

export function ComponentRecipeBook({ recipes }: ComponentRecipeBookProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-10">
      {recipes.map((recipe) => {
        const Preview = recipe.previewId ? recipePreviewRegistry[recipe.previewId] : undefined;

        return (
          <article key={recipe.id} className="overflow-hidden border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]">
            <div className="border-b border-dashed border-border px-4 py-6 sm:px-6 sm:py-7">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex min-h-6 items-center border border-border bg-background/80 px-2 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                    component recipe
                  </span>
                  {recipe.previewId ? (
                    <span className="inline-flex min-h-6 items-center gap-1 border border-border bg-background/80 px-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      <Sparkles className="h-3 w-3" aria-hidden="true" />
                      live preview
                    </span>
                  ) : null}
                </div>

                <h3 className="mt-4 max-w-2xl font-display text-2xl lowercase tracking-tight text-foreground sm:text-[2rem]">
                  {recipe.title}
                </h3>

                <p className="mt-3 max-w-2xl text-sm lowercase leading-relaxed text-muted-foreground">
                  {recipe.summary}
                </p>

                {recipe.description ? (
                  <p className="mt-2 max-w-2xl text-xs lowercase leading-relaxed text-muted-foreground/80">
                    {recipe.description}
                  </p>
                ) : null}
              </div>

              <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                {recipe.shortcuts && recipe.shortcuts.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {recipe.shortcuts.map((shortcut) => (
                      <div key={`${recipe.id}-${shortcut.combo}`} className="inline-flex min-h-9 items-center gap-2 border border-border bg-background/70 px-3">
                        <span className="text-xs lowercase text-foreground">{shortcut.label}</span>
                        <kbd className="inline-flex min-h-6 items-center justify-center border border-border bg-card/70 px-2 font-mono text-[10px] uppercase text-muted-foreground">
                          {shortcut.combo}
                        </kbd>
                      </div>
                    ))}
                  </div>
                ) : <div />}

                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(recipe.code);
                    setCopiedId(recipe.id);
                    window.setTimeout(() => setCopiedId((current) => current === recipe.id ? null : current), 1600);
                    trackDocsEvent("component_recipe_copied", { recipeId: recipe.id });
                  }}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-border bg-background/80 px-3 font-mono text-[11px] lowercase text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  {copiedId === recipe.id ? "copied" : "copy full component"}
                </button>
              </div>
            </div>

            <div className="grid gap-0">
              <div className="border-b border-dashed border-border px-4 py-5 sm:px-6">
                {Preview ? (
                  <Preview recipe={recipe} />
                ) : (
                  <div className="border border-dashed border-border bg-card/20 p-4">
                    <p className="text-sm lowercase leading-relaxed text-muted-foreground">
                      this recipe is code-only right now. add a preview component to the registry when you want a live sandbox.
                    </p>
                  </div>
                )}

                {recipe.notes && recipe.notes.length > 0 ? (
                  <div className="mt-5 grid gap-2">
                    {recipe.notes.map((note) => (
                      <div key={note} className="border-l border-primary/30 pl-3 text-xs lowercase leading-relaxed text-muted-foreground">
                        {note}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="px-4 py-5 sm:px-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value={`${recipe.id}-source`} className="border border-border bg-card/30 px-3">
                    <AccordionTrigger className="py-3 text-left hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="font-mono text-[11px] lowercase text-primary">copy-ready source</span>
                        <span className="text-xs lowercase text-muted-foreground">
                          expand only when you want the full component code.
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 pt-1">
                      <CodeBlock code={recipe.code} language={recipe.language} />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
