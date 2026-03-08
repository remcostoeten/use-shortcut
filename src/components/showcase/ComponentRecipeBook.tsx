import { useEffect, useRef, useState, type ComponentType } from "react";
import { useShortcut } from "@remcostoeten/use-shortcut";
import { Copy, LogIn, Sparkles, UserCircle2 } from "lucide-react";
import type { ComponentRecipe } from "@/config/types";
import { trackDocsEvent } from "@/lib/analytics";
import { CodeBlock } from "./CodeBlock";

interface ComponentRecipeBookProps {
  recipes: ComponentRecipe[];
}

interface RecipePreviewProps {
  recipe: ComponentRecipe;
}

function AvatarLoginRecipePreview({ recipe }: RecipePreviewProps) {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState("click the avatar or focus this preview and press shift+l");
  const [loginCount, setLoginCount] = useState(0);
  const [activeCombo, setActiveCombo] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const $ = useShortcut({ target, ignoreInputs: false });

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

  const triggerLogin = (source: "button" | "shortcut") => {
    setMenuOpen(true);
    setStatus("login triggered");
    setLoginCount((count) => count + 1);
    flashShortcut("shift+l");
    target?.focus();

    trackDocsEvent("component_recipe_triggered", {
      recipeId: recipe.id,
      source,
      combo: source === "shortcut" ? "shift+l" : undefined,
    });
  };

  $.shift.key("l").on(() => {
    triggerLogin("shortcut");
  }, { preventDefault: true });

  return (
    <div className="border border-dashed border-border bg-card/30 p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] lowercase text-primary">live recipe</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            click the avatar, or focus the preview and press{" "}
            <kbd className="font-mono text-[11px] text-foreground">shift+l</kbd>.
          </p>
        </div>
        <span aria-live="polite" className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {loginCount} triggers
        </span>
      </div>

      <div
        ref={setTarget}
        tabIndex={0}
        className="min-h-[188px] border border-border bg-background p-4 outline-none transition-colors focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">
              auth entry
            </p>
            <p className="mt-2 max-w-[26ch] text-sm lowercase leading-relaxed text-foreground">
              lightweight profile shell with one keyboard-accessible login action.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setMenuOpen((open) => !open);
              setStatus(menuOpen ? "profile menu hidden" : "profile menu opened");
              target?.focus();
            }}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary/40 hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Open profile actions"
            aria-expanded={menuOpen}
          >
            <UserCircle2 className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className={`border p-3 transition-colors ${menuOpen ? "border-primary/40 bg-primary/8" : "border-border bg-card/30"}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">
                  user menu
                </p>
                <p className="mt-2 text-sm lowercase text-foreground">
                  {menuOpen ? "ready for auth actions" : "closed"}
                </p>
              </div>
              <kbd className={`inline-flex min-h-7 items-center justify-center border px-2 font-mono text-[11px] transition-colors ${
                activeCombo === "shift+l" ? "border-primary/50 bg-primary/12 text-primary" : "border-border bg-background text-muted-foreground"
              }`}>
                shift+l
              </kbd>
            </div>

            {menuOpen ? (
              <button
                type="button"
                onClick={() => triggerLogin("button")}
                className="mt-3 inline-flex min-h-11 items-center gap-2 border border-primary/40 bg-primary/10 px-3 font-mono text-[11px] lowercase text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                login
                <kbd className="ml-1 inline-flex min-h-6 items-center justify-center border border-primary/30 bg-background/60 px-1.5 font-mono text-[10px] uppercase text-primary/80">
                  shift+l
                </kbd>
              </button>
            ) : (
              <p className="mt-3 text-xs lowercase leading-relaxed text-muted-foreground">
                open the avatar menu to reveal the login action.
              </p>
            )}
          </div>

          <div className="border border-dashed border-border bg-card/20 px-3 py-2.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">
              status
            </p>
            <p aria-live="polite" className="mt-2 text-sm lowercase text-foreground">
              {status}
            </p>
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
    <div className="flex flex-col gap-8">
      {recipes.map((recipe) => {
        const Preview = recipe.previewId ? recipePreviewRegistry[recipe.previewId] : undefined;

        return (
          <article key={recipe.id} className="border border-border bg-card/36">
            <div className="border-b border-dashed border-border px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex min-h-6 items-center border border-border bg-background px-2 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                      component recipe
                    </span>
                    {recipe.previewId ? (
                      <span className="inline-flex min-h-6 items-center gap-1 border border-border bg-background px-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        live preview
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 font-display text-xl lowercase tracking-tight text-foreground">
                    {recipe.title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm lowercase leading-relaxed text-muted-foreground">
                    {recipe.summary}
                  </p>
                  {recipe.description ? (
                    <p className="mt-2 max-w-2xl text-xs lowercase leading-relaxed text-muted-foreground/80">
                      {recipe.description}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(recipe.code);
                    setCopiedId(recipe.id);
                    window.setTimeout(() => setCopiedId((current) => current === recipe.id ? null : current), 1600);
                    trackDocsEvent("component_recipe_copied", { recipeId: recipe.id });
                  }}
                  className="inline-flex min-h-11 items-center gap-2 border border-border bg-background px-3 font-mono text-[11px] lowercase text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  {copiedId === recipe.id ? "copied" : "copy full component"}
                </button>
              </div>

              {recipe.shortcuts && recipe.shortcuts.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {recipe.shortcuts.map((shortcut) => (
                    <div key={`${recipe.id}-${shortcut.combo}`} className="inline-flex min-h-9 items-center gap-2 border border-border bg-background px-3">
                      <span className="text-xs lowercase text-foreground">{shortcut.label}</span>
                      <kbd className="inline-flex min-h-6 items-center justify-center border border-border bg-card px-2 font-mono text-[10px] uppercase text-muted-foreground">
                        {shortcut.combo}
                      </kbd>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid gap-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="border-b border-dashed border-border px-4 py-4 lg:border-b-0 lg:border-r sm:px-5">
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
                  <div className="mt-4 grid gap-2">
                    {recipe.notes.map((note) => (
                      <div key={note} className="border-l border-primary/30 pl-3 text-xs lowercase leading-relaxed text-muted-foreground">
                        {note}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="px-4 py-4 sm:px-5">
                <p className="mb-3 font-mono text-[11px] lowercase text-primary">copy-ready source</p>
                <CodeBlock code={recipe.code} language={recipe.language} />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
