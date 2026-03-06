import { useState, useCallback, useRef } from "react";
import { useShortcut, formatShortcut } from "@remcostoeten/use-shortcut";
import { SyntaxHighlight } from "@/components/showcase/SyntaxHighlight";

interface ShortcutEvent {
  id: number;
  combo: string;
  display: string;
  label: string;
  timestamp: number;
}

const MAX_EVENTS = 12;

interface DemoShortcut {
  code: string;
  combo: string;
  display: string;
  label: string;
}

const DEMO_SHORTCUTS: DemoShortcut[] = [
  { code: '$.cmd.key("s").on(() => save())', combo: "cmd+s", display: "", label: "save" },
  { code: '$.mod.key("k").on(() => search())', combo: "mod+k", display: "", label: "search" },
  { code: '$.mod.key("z").on(() => undo())', combo: "mod+z", display: "", label: "undo" },
  { code: '$.mod.key("c").on(() => copy())', combo: "mod+c", display: "", label: "copy" },
  { code: '$.key("/").on(() => focusSearch())', combo: "/", display: "/", label: "focus search" },
  { code: '$.shift.key("slash").except("typing").on(() => toggleHelp())', combo: "shift+slash", display: "?", label: "toggle help" },
  { code: '$.key("escape").on(() => dismiss())', combo: "escape", display: "Esc", label: "dismiss" },
];

export function UseShortcutDemo() {
  const [events, setEvents] = useState<ShortcutEvent[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [activeCombo, setActiveCombo] = useState<string | null>(null);
  const idRef = useRef(0);

  const pushEvent = useCallback((combo: string, display: string, label: string) => {
    const id = ++idRef.current;
    setEvents((prev) => [{ id, combo, display, label, timestamp: Date.now() }, ...prev].slice(0, MAX_EVENTS));
    setActiveCombo(combo);
    setTimeout(() => setActiveCombo(null), 500);
  }, []);

  const $ = useShortcut({ disabled: !isActive, ignoreInputs: true });

  const save = $.cmd.key("s").on(
    () => pushEvent("cmd+s", formatShortcut("cmd+s"), "save"),
    { preventDefault: true }
  );
  const search = $.mod.key("k").on(
    () => pushEvent("mod+k", formatShortcut("mod+k"), "search"),
    { preventDefault: true }
  );
  const undo = $.mod.key("z").on(
    () => pushEvent("mod+z", formatShortcut("mod+z"), "undo"),
    { preventDefault: true }
  );
  const copy = $.mod.key("c").on(
    () => pushEvent("mod+c", formatShortcut("mod+c"), "copy"),
    { preventDefault: true }
  );
  $.key("slash").on(
    () => pushEvent("/", "/", "focus search"),
  );
  $.shift.key("slash").except("typing").on(
    () => pushEvent("shift+slash", "?", "toggle help"),
  );
  $.key("escape").on(
    () => pushEvent("escape", "Esc", "dismiss"),
  );

  const shortcuts = DEMO_SHORTCUTS.map((s, i) => ({
    ...s,
    display: i === 0 ? save.display
      : i === 1 ? search.display
      : i === 2 ? undo.display
      : i === 3 ? copy.display
      : s.display,
  }));

  const sourceLines = [
    'const $ = useShortcut()',
    '',
    ...shortcuts.map((s) => s.code),
  ];

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-block h-2 w-2 rounded-full bg-primary/80 animate-pulse" />
          <p className="font-mono text-xs text-muted-foreground lowercase">
            interactive playground
          </p>
        </div>
        <button
          onClick={() => setIsActive(!isActive)}
          className={`font-mono text-[10px] px-2.5 py-1 border transition-colors ${
            isActive
              ? "border-primary/40 bg-primary/5 text-primary"
              : "border-border bg-card text-muted-foreground"
          }`}
        >
          {isActive ? "listening" : "paused"}
        </button>
      </div>

      {/* Main playground area */}
      <div className="border border-border overflow-hidden">
        {/* Tab bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card/60 px-4 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <span className="font-mono text-[10px] text-primary lowercase">shortcuts.tsx</span>
            <span className="font-mono text-[10px] text-muted-foreground/40">|</span>
            <span className="font-mono text-[10px] text-muted-foreground/50 lowercase">read-only</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-primary/40" />
          </div>
        </div>

        {/* Code editor with line numbers + syntax highlighting */}
        <div className="bg-background">
          <pre className="py-4">
            {sourceLines.map((line, i) => {
              const isHighlighted = activeCombo && shortcuts.some(
                (s) => s.combo === activeCombo && line.includes(s.label)
              );
              return (
                <div
                  key={i}
                  className={`flex transition-colors duration-300 ${
                    isHighlighted ? "bg-primary/8" : "hover:bg-card/40"
                  }`}
                >
                  <span className={`select-none w-10 shrink-0 text-right pr-4 font-mono text-[11px] leading-relaxed ${
                    isHighlighted ? "text-primary/60" : "text-muted-foreground/30"
                  }`}>
                    {i + 1}
                  </span>
                  <span className={`min-w-0 flex-1 border-l pl-4 pr-4 font-mono text-[11px] leading-relaxed break-words [overflow-wrap:anywhere] ${
                    isHighlighted ? "border-primary/40" : "border-border/40"
                  }`}>
                    {line ? (
                      <SyntaxHighlight code={line} />
                    ) : (
                      "\u00A0"
                    )}
                  </span>
                </div>
              );
            })}
          </pre>
        </div>

        {/* Keyboard shortcut chips */}
        <div className="border-t border-border bg-card/30 px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {shortcuts.map((s) => (
              <button
                key={s.combo}
                className={`group flex items-center gap-2 px-3 py-2 border font-mono text-xs transition-all duration-300 ${
                  activeCombo === s.combo
                    ? "border-primary/50 bg-primary/8 text-primary scale-[1.02]"
                    : "border-border bg-background text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                }`}
              >
                <kbd className={`font-mono text-[11px] tracking-wide transition-colors duration-300 ${
                  activeCombo === s.combo ? "text-primary" : "text-foreground/70 group-hover:text-foreground"
                }`}>
                  {s.display}
                </kbd>
                <span className="text-[10px] text-muted-foreground/60 lowercase">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Event log */}
      <div className="border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/40">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground lowercase">event log</span>
            {events.length > 0 && (
              <span className="font-mono text-[10px] text-muted-foreground/40">
                ({events.length})
              </span>
            )}
          </div>
          {events.length > 0 && (
            <button
              onClick={() => setEvents([])}
              className="font-mono text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              clear
            </button>
          )}
        </div>
        <div className="min-h-[72px] max-h-[152px] overflow-y-auto">
          {events.length === 0 ? (
            <div className="flex items-center justify-center h-[72px]">
              <p className="font-mono text-[10px] text-muted-foreground/40 lowercase">
                waiting for input...
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {events.map((ev, i) => (
                <div
                  key={ev.id}
                  className={`flex items-center gap-3 px-4 py-2 border-b border-border/30 last:border-0 transition-colors ${
                    i === 0 ? "bg-primary/5" : ""
                  }`}
                  style={{ animation: i === 0 ? "demoSlideIn 180ms ease-out" : undefined }}
                >
                  <kbd className="font-mono text-[11px] text-primary min-w-[56px]">{ev.display}</kbd>
                  <span className="font-mono text-[10px] text-muted-foreground lowercase flex-1">{ev.label}</span>
                  <span className="font-mono text-[10px] text-muted-foreground/30 tabular-nums">
                    {new Date(ev.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
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
