import { useEffect, useRef, useState } from "react";
import { useShortcut, formatShortcut } from "@remcostoeten/use-shortcut";
import { Save, CircleHelp, X } from "lucide-react";
import { SyntaxHighlight } from "@/components/showcase/SyntaxHighlight";

interface ShortcutEvent {
  id: number;
  combo: string;
  display: string;
  label: string;
  timestamp: number;
}

interface DemoShortcut {
  code: string;
  combo: string;
  display: string;
  label: string;
}

const MAX_EVENTS = 12;

const DEMO_SHORTCUTS: DemoShortcut[] = [
  { code: '$.cmd.key("s").on(() => save())', combo: "cmd+s", display: "", label: "save" },
  { code: '$.mod.key("k").on(() => search())', combo: "mod+k", display: "", label: "search" },
  { code: '$.mod.key("z").on(() => undo())', combo: "mod+z", display: "", label: "undo" },
  { code: '$.mod.key("c").on(() => copy())', combo: "mod+c", display: "", label: "copy" },
  { code: '$.key("slash").on(() => focusSearch())', combo: "/", display: "/", label: "focus search" },
  { code: '$.shift.key("slash").except("typing").on(() => toggleHelp())', combo: "shift+slash", display: "?", label: "toggle help" },
  { code: '$.key("escape").on(() => dismiss())', combo: "escape", display: "Esc", label: "dismiss" },
] as const;

export function UseShortcutDemo() {
  const [events, setEvents] = useState<ShortcutEvent[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [activeCombo, setActiveCombo] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const idRef = useRef(0);
  const helpOpenRef = useRef(false);
  const toastRef = useRef<string | null>(null);
  const flashTimeoutRef = useRef<number | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    helpOpenRef.current = helpOpen;
  }, [helpOpen]);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        window.clearTimeout(flashTimeoutRef.current);
      }
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const flashCombo = (combo: string) => {
    setActiveCombo(combo);
    if (flashTimeoutRef.current) {
      window.clearTimeout(flashTimeoutRef.current);
    }
    flashTimeoutRef.current = window.setTimeout(() => setActiveCombo(null), 700);
  };

  const showToast = (message: string) => {
    toastRef.current = message;
    setToast(message);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      toastRef.current = null;
      setToast(null);
    }, 2200);
  };

  const pushEvent = (combo: string, display: string, label: string) => {
    const id = ++idRef.current;
    setEvents((prev) => [{ id, combo, display, label, timestamp: Date.now() }, ...prev].slice(0, MAX_EVENTS));
    flashCombo(combo);
  };

  const saveDraft = () => {
    showToast("Save triggered");
    pushEvent("cmd+s", formatShortcut("cmd+s"), "save");
  };

  const openSearch = () => {
    showToast("Command trigger fired");
    pushEvent("mod+k", formatShortcut("mod+k"), "search");
  };

  const undoDraft = () => {
    showToast("Undo triggered");
    pushEvent("mod+z", formatShortcut("mod+z"), "undo");
  };

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(`const $ = useShortcut()\n$.mod.key("k").on(openSearch, { preventDefault: true })`);
      showToast("Snippet copied");
    } catch {
      showToast("Clipboard unavailable");
    }
    pushEvent("mod+c", formatShortcut("mod+c"), "copy");
  };

  const focusSearchOnly = () => {
    showToast("Slash shortcut fired");
    pushEvent("/", "/", "focus search");
  };

  const toggleHelp = () => {
    setHelpOpen((open) => {
      const next = !open;
      showToast(next ? "Help opened" : "Help hidden");
      return next;
    });
    pushEvent("shift+slash", "?", "toggle help");
  };

  const dismissSurface = () => {
    let dismissed = false;
    if (helpOpenRef.current) {
      helpOpenRef.current = false;
      setHelpOpen(false);
      dismissed = true;
    }
    if (toastRef.current) {
      toastRef.current = null;
      setToast(null);
      dismissed = true;
    }
    if (!dismissed) {
      showToast("Nothing to dismiss");
    }
    pushEvent("escape", "Esc", "dismiss");
  };

  const $ = useShortcut({ disabled: !isActive, ignoreInputs: true });
  useEffect(() => {
    const registrations = [
      $.cmd.key("s").on(saveDraft, { preventDefault: true }),
      $.mod.key("k").on(openSearch, { preventDefault: true }),
      $.mod.key("z").on(undoDraft, { preventDefault: true }),
      $.mod.key("c").on(copySnippet, { preventDefault: true }),
      $.key("slash").except("typing").on(focusSearchOnly, { preventDefault: true }),
      $.shift.key("slash").except("typing").on(toggleHelp, { preventDefault: true }),
      $.key("escape").on(dismissSurface),
    ];

    return () => {
      registrations.forEach((registration) => registration.unbind());
    };
  }, [$]);

  const shortcuts = DEMO_SHORTCUTS.map((shortcut, index) => ({
    ...shortcut,
    display:
      index === 0 ? formatShortcut("cmd+s")
      : index === 1 ? formatShortcut("mod+k")
      : index === 2 ? formatShortcut("mod+z")
      : index === 3 ? formatShortcut("mod+c")
      : shortcut.display,
  }));

  const sourceLines = [
    "const $ = useShortcut()",
    "",
    ...shortcuts.map((shortcut) => shortcut.code),
  ];

  const runShortcut = (combo: string) => {
    switch (combo) {
      case "cmd+s":
        saveDraft();
        break;
      case "mod+k":
        openSearch();
        break;
      case "mod+z":
        undoDraft();
        break;
      case "mod+c":
        void copySnippet();
        break;
      case "/":
        focusSearchOnly();
        break;
      case "shift+slash":
        toggleHelp();
        break;
      case "escape":
        dismissSurface();
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <span className="sr-only" aria-live="polite">
        {toast ?? ""}
      </span>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`inline-block h-2 w-2 rounded-full ${isActive ? "bg-primary/80 animate-pulse" : "bg-muted-foreground/40"}`} />
          <p className="font-mono text-xs text-muted-foreground lowercase">
            live shortcut workspace
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsActive((active) => !active)}
          className={`min-h-9 border px-2.5 py-1 font-mono text-[10px] transition-colors ${
            isActive
              ? "border-primary/40 bg-primary/5 text-primary"
              : "border-border bg-card text-muted-foreground"
          }`}
        >
          {isActive ? "listening" : "paused"}
        </button>
      </div>

      <div className="overflow-hidden border border-border">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card/60 px-4 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <span className="font-mono text-[10px] lowercase text-primary">shortcuts.tsx</span>
            <span className="font-mono text-[10px] text-muted-foreground/40">|</span>
            <span className="font-mono text-[10px] lowercase text-muted-foreground/50">wired to fake ui</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-primary/40" />
          </div>
        </div>

        <div className="bg-background">
          <pre className="py-4">
            {sourceLines.map((line, index) => {
              const isHighlighted = activeCombo && shortcuts.some(
                (shortcut) => shortcut.combo === activeCombo && line.includes(shortcut.label),
              );

              return (
                <div
                  key={index}
                  className={`flex transition-colors duration-300 ${
                    isHighlighted ? "bg-primary/8" : "hover:bg-card/40"
                  }`}
                >
                  <span className={`w-10 shrink-0 select-none pr-4 text-right font-mono text-[11px] leading-relaxed ${
                    isHighlighted ? "text-primary/60" : "text-muted-foreground/30"
                  }`}>
                    {index + 1}
                  </span>
                  <span className={`min-w-0 flex-1 break-words border-l pl-4 pr-4 font-mono text-[11px] leading-relaxed [overflow-wrap:anywhere] ${
                    isHighlighted ? "border-primary/40" : "border-border/40"
                  }`}>
                    {line ? <SyntaxHighlight code={line} /> : "\u00A0"}
                  </span>
                </div>
              );
            })}
          </pre>
        </div>

        <div className="border-t border-border bg-card/30 px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {shortcuts.map((shortcut) => (
              <button
                key={shortcut.combo}
                type="button"
                onClick={() => runShortcut(shortcut.combo)}
                className={`group flex min-h-11 items-center gap-2 border px-3 py-2 font-mono text-xs transition-all duration-300 ${
                  activeCombo === shortcut.combo
                    ? "scale-[1.02] border-primary/50 bg-primary/8 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                }`}
              >
                <kbd className={`font-mono text-[11px] tracking-wide transition-colors duration-300 ${
                  activeCombo === shortcut.combo ? "text-primary" : "text-foreground/70 group-hover:text-foreground"
                }`}>
                  {shortcut.display}
                </kbd>
                <span className="text-[10px] lowercase text-muted-foreground/60">{shortcut.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {helpOpen ? (
          <div className="overflow-hidden border border-primary/35 bg-primary/8">
            <div className="flex items-center justify-between border-b border-primary/20 px-4 py-3">
              <div className="flex items-center gap-2">
                <CircleHelp className="h-4 w-4 text-primary" aria-hidden="true" />
                <p className="font-mono text-xs text-primary">[help]</p>
              </div>
              <button
                type="button"
                onClick={dismissSurface}
                className="inline-flex min-h-9 min-w-9 items-center justify-center border border-primary/25 text-primary transition-colors hover:bg-primary/10"
                aria-label="Close help"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 px-4 py-4">
              <p className="text-xs lowercase leading-relaxed text-muted-foreground">
                shortcut help is real here. the demo no longer pretends there is a full app ui behind it.
              </p>
              <div className="grid gap-2">
                {shortcuts.map((shortcut) => (
                  <div key={`help-${shortcut.combo}`} className="flex items-center justify-between gap-3 border border-primary/15 bg-background/40 px-3 py-2">
                    <span className="text-xs lowercase text-foreground">{shortcut.label}</span>
                    <kbd className="font-mono text-[11px] text-primary">{shortcut.display}</kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="overflow-hidden border border-border">
          <div className="flex items-center justify-between border-b border-border bg-card/40 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] lowercase text-muted-foreground">event log</span>
              {events.length > 0 ? (
                <span className="font-mono text-[10px] text-muted-foreground/40">({events.length})</span>
              ) : null}
            </div>
            {events.length > 0 ? (
              <button
                type="button"
                onClick={() => setEvents([])}
                className="font-mono text-[10px] text-muted-foreground/50 transition-colors hover:text-foreground"
              >
                clear
              </button>
            ) : null}
          </div>
          <div className="min-h-[120px] max-h-[248px] overflow-y-auto">
            {events.length === 0 ? (
              <div className="flex h-[120px] items-center justify-center">
                <p className="font-mono text-[10px] lowercase text-muted-foreground/40">
                  waiting for input…
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {events.map((event, index) => (
                  <div
                    key={event.id}
                    className={`flex items-center gap-3 border-b border-border/30 px-4 py-2 last:border-0 transition-colors ${
                      index === 0 ? "bg-primary/5" : ""
                    }`}
                    style={{ animation: index === 0 ? "demoSlideIn 180ms ease-out" : undefined }}
                  >
                    <kbd className="min-w-[56px] font-mono text-[11px] text-primary">{event.display}</kbd>
                    <span className="flex-1 font-mono text-[10px] lowercase text-muted-foreground">{event.label}</span>
                    <span className="font-mono text-[10px] tabular-nums text-muted-foreground/30">
                      {new Date(event.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {toast ? (
          <div className="flex items-center gap-2 border border-border bg-card/70 px-4 py-3">
            <Save className="h-4 w-4 text-primary" aria-hidden="true" />
            <p className="text-xs lowercase text-foreground">{toast}</p>
          </div>
        ) : (
          <div className="overflow-hidden border border-border">
            <div className="border border-dashed border-border px-4 py-3">
              <p className="text-xs lowercase leading-relaxed text-muted-foreground">
                try `cmd+s`, `mod+k`, `/`, `?`, `mod+c`, `mod+z`, or `esc`.
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes demoSlideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
