import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Code, prose } from "./code"
import {
  useShortcut,
  useShortcutBinding,
  useShortcutMap,
  useShortcutGroup,
  type ShortcutAttemptDebugEvent,
  type ShortcutDebugEvent,
  type ShortcutMap,
  type ShortcutResult,
  type ShortcutConflict,
} from "@remcostoeten/use-shortcut/react"
import { formatShortcut } from "@remcostoeten/use-shortcut/formatter"
import { parseShortcut } from "@remcostoeten/use-shortcut/parser"
import "./styles.css"

type ScopeName = "global" | "editor" | "palette" | "chaining" | "groups"
type PanelName = "intro" | "editor" | "debug" | "settings" | "chaining" | "groups"

type Activity = {
  id: number
  label: string
  combo: string
  detail: string
}

const PANELS: PanelName[] = ["intro", "editor", "debug", "settings", "chaining", "groups"]
const SCOPES: ScopeName[] = ["global", "editor", "palette", "chaining", "groups"]
const STORAGE_KEY = "shortcut-lab-document"
const THEME_KEY = "shortcut-lab-theme"

const DEFAULT_DOCUMENT = [
  "# Shortcut Lab",
  "",
  "This editor is wired to @remcostoeten/use-shortcut.",
  "Use Cmd/Ctrl+K for the palette, Cmd/Ctrl+S to save, and g then d for debug.",
  "",
  "Try recording a shortcut in settings and watch the debug stream explain each key.",
].join("\n")

function readSearchState(): { panel: PanelName; scope: ScopeName } {
  const params = new URLSearchParams(window.location.search)
  const panel = params.get("panel")
  const scope = params.get("scope")

  const resolvedPanel = panel === "docs" ? "intro" : panel

  return {
    panel: PANELS.includes(resolvedPanel as PanelName) ? (resolvedPanel as PanelName) : "intro",
    scope: SCOPES.includes(scope as ScopeName) ? (scope as ScopeName) : "editor",
  }
}

function writeSearchState(panel: PanelName, scope: ScopeName) {
  const params = new URLSearchParams(window.location.search)
  params.set("panel", panel)
  params.set("scope", scope)
  window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`)
}

function describeParsedShortcut(combo: string) {
  try {
    const parsed = parseShortcut(combo)
    const modifiers = [
      parsed.modifiers.meta ? "meta" : "",
      parsed.modifiers.ctrl ? "ctrl" : "",
      parsed.modifiers.alt ? "alt" : "",
      parsed.modifiers.shift ? "shift" : "",
    ].filter(Boolean)

    return `${modifiers.join(" + ") || "no modifiers"} -> ${parsed.key}`
  } catch {
    return "not parseable yet"
  }
}

function displayShortcut(combo: string) {
  if (combo.includes(" then ")) {
    return combo.split(/\s+then\s+/i).map((step) => formatShortcut(step)).join(" then ")
  }

  if (combo.includes(" ")) {
    return combo.split(/\s+/).map((step) => formatShortcut(step)).join(" then ")
  }

  return formatShortcut(combo)
}

function panelKbd(item: PanelName): string {
  switch (item) {
    case "intro": return "g h"
    case "debug": return "g d"
    case "settings": return "g s"
    case "chaining": return "g c"
    case "groups": return "g g"
    default: return "esc"
  }
}

type ShortcutLabAppProps = {
  docsPath: string
}

export function ShortcutLabApp({ docsPath }: ShortcutLabAppProps) {
  const navigate = useNavigate()
  const initialState = useMemo(readSearchState, [])
  const [panel, setPanel] = useState<PanelName>(initialState.panel)
  const [scope, setScope] = useState<ScopeName>(initialState.scope)
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) !== "light")
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [documentText, setDocumentText] = useState(() => localStorage.getItem(STORAGE_KEY) ?? DEFAULT_DOCUMENT)
  const [savedText, setSavedText] = useState(documentText)
  const [activities, setActivities] = useState<Activity[]>([])
  const [debugEvents, setDebugEvents] = useState<ShortcutDebugEvent[]>([])
  const [attempt, setAttempt] = useState<ShortcutAttemptDebugEvent | null>(null)
  const [announcement, setAnnouncement] = useState("Shortcut Lab ready.")
  const [recordedCombo, setRecordedCombo] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const idRef = useRef(0)
  const editorRef = useRef<HTMLTextAreaElement | null>(null)
  const paletteInputRef = useRef<HTMLInputElement | null>(null)
  const panelRef = useRef(panel)
  const scopeRef = useRef(scope)
  const paletteOpenRef = useRef(paletteOpen)
  const documentTextRef = useRef(documentText)
  const savedTextRef = useRef(savedText)

  const isDirty = documentText !== savedText

  useEffect(() => {
    rootRef.current?.setAttribute("data-theme", dark ? "dark" : "light")
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light")
  }, [dark])

  const openDocsReference = useCallback(() => {
    navigate(`${docsPath}#api-reference`)
  }, [docsPath, navigate])

  useEffect(() => {
    panelRef.current = panel
    scopeRef.current = scope
    writeSearchState(panel, scope)
  }, [panel, scope])

  useEffect(() => {
    paletteOpenRef.current = paletteOpen
    if (paletteOpen) {
      window.setTimeout(() => paletteInputRef.current?.focus(), 0)
    }
  }, [paletteOpen])

  useEffect(() => { documentTextRef.current = documentText }, [documentText])
  useEffect(() => { savedTextRef.current = savedText }, [savedText])

  useEffect(() => {
    const onPopState = () => {
      const next = readSearchState()
      setPanel(next.panel)
      setScope(next.scope)
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  const pushActivity = (label: string, combo: string, detail: string) => {
    const activity = { id: ++idRef.current, label, combo, detail }
    setActivities((current) => [activity, ...current].slice(0, 9))
    setAnnouncement(`${label}: ${detail}`)
  }

  const saveDocument = () => {
    localStorage.setItem(STORAGE_KEY, documentTextRef.current)
    setSavedText(documentTextRef.current)
    pushActivity("Saved", "mod+s", "document stored locally")
  }

  const closeActiveSurface = () => {
    if (paletteOpenRef.current) {
      setPaletteOpen(false)
      pushActivity("Closed", "escape", "command palette dismissed")
      return
    }
    editorRef.current?.focus()
    pushActivity("Focused", "escape", "editor restored")
  }

  const openPalette = () => {
    setPaletteOpen(true)
    setScope("palette")
    pushActivity("Palette", "mod+k", "command palette opened")
  }

  const setPanelAndScope = (nextPanel: PanelName, nextScope: ScopeName, combo: string) => {
    setPanel(nextPanel)
    setScope(nextScope)
    pushActivity("Navigate", combo, `${nextPanel} panel active`)
  }

  const undoTyping = () => {
    setDocumentText(savedTextRef.current)
    pushActivity("Undo", "mod+z", "document restored to last save")
  }

  const redoDemo = () => {
    setDocumentText((current) => `${current}\nRedo marker ${new Date().toLocaleTimeString()}`)
    pushActivity("Redo", "mod+shift+z", "demo marker appended")
  }

  const shortcutOptions = {
    ignoreInputs: false,
    activeScopes: scope,
    debug: { console: false, includeCode: true, includeLocation: true, includeKeyCode: true },
  } as const

  const $ = useShortcut(shortcutOptions)

  useEffect(() => { $.setScopes(scope) }, [$, scope])

  useEffect(() => {
    const unsubscribe = $.onDebug((event) => {
      setDebugEvents((current) => [event, ...current].slice(0, 12))
    })
    return unsubscribe
  }, [$])

  const editorShortcuts = useMemo<ShortcutMap>(() => ({
    save: {
      keys: "mod+s",
      handler: saveDocument,
      options: { description: "Save document", scopes: "editor", preventDefault: true },
    },
    undo: {
      keys: "mod+z",
      handler: undoTyping,
      options: { description: "Undo to saved state", scopes: "editor", preventDefault: true },
    },
    redo: {
      keys: "mod+shift+z",
      handler: redoDemo,
      options: { description: "Append redo marker", scopes: "editor", preventDefault: true },
    },
    debugPanel: {
      keys: "g then d",
      handler: () => setPanelAndScope("debug", "global", "g then d"),
      options: { description: "Open debug panel", scopes: ["editor", "global"] },
    },
    settingsPanel: {
      keys: "g then s",
      handler: () => setPanelAndScope("settings", "global", "g then s"),
      options: { description: "Open settings panel", scopes: ["editor", "global"] },
    },
    chainingPanel: {
      keys: "g then c",
      handler: () => setPanelAndScope("chaining", "chaining", "g then c"),
      options: { description: "Open chaining panel", scopes: ["editor", "global"] },
    },
    groupsPanel: {
      keys: "g then g",
      handler: () => setPanelAndScope("groups", "groups", "g then g"),
      options: { description: "Open groups panel", scopes: ["editor", "global"] },
    },
    docsReference: {
      keys: "g then /",
      handler: openDocsReference,
      options: { description: "Open full API reference", scopes: ["editor", "global"] },
    },
    introPanel: {
      keys: "g then h",
      handler: () => setPanelAndScope("intro", "global", "g then h"),
      options: { description: "Open intro panel", scopes: ["editor", "global"] },
    },
  }), [openDocsReference])

  const editorResults = useShortcutMap(editorShortcuts, shortcutOptions)

  useShortcutBinding("mod+k", openPalette, {
    description: "Open command palette",
    preventDefault: true,
    scopes: ["global", "editor", "palette"],
  }, shortcutOptions)

  useShortcutBinding("escape", closeActiveSurface, {
    description: "Close current surface",
    scopes: ["global", "editor", "palette"],
  }, shortcutOptions)

  useEffect(() => {
    const unsubscribe = editorResults.debugPanel.onAttempt?.((_, __, details) => {
      if (details) setAttempt(details)
    })
    return unsubscribe
  }, [editorResults])

  const startRecording = async () => {
    setRecording(true)
    setAnnouncement("Recording next shortcut.")
    try {
      const combo = await $.record({ timeoutMs: 5000 })
      setRecordedCombo(combo)
      pushActivity("Recorded", combo, describeParsedShortcut(combo))
    } catch (error) {
      const message = error instanceof Error ? error.message : "recording failed"
      pushActivity("Recording", "record", message)
    } finally {
      setRecording(false)
    }
  }

  const commandItems = [
    { label: "Open intro", combo: "g then h", action: () => setPanelAndScope("intro", "global", "palette") },
    { label: "Open editor", combo: "g then e", action: () => setPanelAndScope("editor", "editor", "palette") },
    { label: "Open debug", combo: "g then d", action: () => setPanelAndScope("debug", "global", "palette") },
    { label: "Open settings", combo: "g then s", action: () => setPanelAndScope("settings", "global", "palette") },
    { label: "Open chaining", combo: "g then c", action: () => setPanelAndScope("chaining", "chaining", "palette") },
    { label: "Open groups", combo: "g then g", action: () => setPanelAndScope("groups", "groups", "palette") },
    { label: "Open API reference", combo: "g then /", action: openDocsReference },
    { label: "Save document", combo: "mod+s", action: saveDocument },
  ]

  return (
    <div ref={rootRef} className="shortcut-lab-root" data-theme={dark ? "dark" : "light"}>
    <main id="main" className="lab-shell">
      <Link to={docsPath} className="skip-link">
        Back to docs
      </Link>
      <section className="topbar" aria-label="Shortcut Lab status">
        <div>
          <p className="eyebrow">workspace example</p>
          <h1>Shortcut Lab</h1>
        </div>
        <div className="topbar-actions" role="group" aria-label="Active scope">
          {SCOPES.map((item) => (
            <button
              key={item}
              type="button"
              className={scope === item ? "chip active" : "chip"}
              onClick={() => setScope(item)}
            >
              {item}
            </button>
          ))}
          <label
            className="theme-toggle"
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
          >
            <input
              type="checkbox"
              checked={dark}
              onChange={() => setDark((d) => !d)}
            />
            <span className="theme-toggle-track">
              <span className="theme-toggle-knob" />
            </span>
          </label>
        </div>
      </section>

      <section className="lab-grid">
        <aside className="rail" aria-label="Panels">
          {PANELS.map((item) => (
            <button
              key={item}
              type="button"
              className={panel === item ? "rail-button active" : "rail-button"}
              onClick={() => setPanel(item)}
            >
              <span>{item}</span>
              <kbd>{panelKbd(item)}</kbd>
            </button>
          ))}

          <div className="rail-card">
            <p className="eyebrow">registered</p>
            <dl>
              <div><dt>save</dt><dd>{editorResults.save.display}</dd></div>
              <div><dt>debug</dt><dd>{editorResults.debugPanel.display}</dd></div>
              <div><dt>palette</dt><dd>{displayShortcut("mod+k")}</dd></div>
            </dl>
          </div>
        </aside>

        <section className="surface" aria-label={`${panel} panel`}>
          {panel === "editor" ? (
            <EditorPanel
              text={documentText}
              dirty={isDirty}
              onTextChange={setDocumentText}
              editorRef={editorRef}
              onSave={saveDocument}
            />
          ) : null}

          {panel === "debug" ? (
            <DebugPanel events={debugEvents} attempt={attempt} recordedCombo={recordedCombo} />
          ) : null}

          {panel === "settings" ? (
            <SettingsPanel
              recording={recording}
              recordedCombo={recordedCombo}
              onRecord={() => void startRecording()}
              onScopeChange={setScope}
              scope={scope}
            />
          ) : null}

          {panel === "intro" ? <IntroPanel docsPath={docsPath} onNavigate={setPanel} /> : null}
          {panel === "chaining" ? <ChainingPanel /> : null}
          {panel === "groups" ? <GroupsPanel /> : null}
        </section>

        <aside className="activity" aria-label="Shortcut activity">
          <div className="activity-head">
            <p className="eyebrow">activity</p>
            <span>{activities.length}</span>
          </div>
          <div className="activity-list">
            {activities.length === 0 ? (
              <p className="empty">Press {displayShortcut("mod+k")} or {displayShortcut("mod+s")}.</p>
            ) : activities.map((item) => (
              <article key={item.id} className="activity-item">
                <kbd>{displayShortcut(item.combo)}</kbd>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.detail}</span>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </section>

      {paletteOpen ? (
        <div className="palette-backdrop" role="presentation" onMouseDown={() => setPaletteOpen(false)}>
          <section
            className="palette"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <input
              ref={paletteInputRef}
              aria-label="Search commands"
              placeholder="Search commands…"
              spellCheck={false}
            />
            <div className="command-list">
              {commandItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    item.action()
                    setPaletteOpen(false)
                  }}
                >
                  <span>{item.label}</span>
                  <kbd>{displayShortcut(item.combo)}</kbd>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      <span className="sr-only" aria-live="polite">{announcement}</span>
    </main>
    </div>
  )
}

// ─── Editor panel ────────────────────────────────────────────────────────────

function EditorPanel(props: {
  text: string
  dirty: boolean
  onTextChange: (next: string) => void
  editorRef: React.RefObject<HTMLTextAreaElement | null>
  onSave: () => void
}) {
  return (
    <div className="panel-stack">
      <div className="panel-head">
        <div>
          <p className="eyebrow">editor</p>
          <h2>Command driven draft</h2>
        </div>
        <button type="button" className="primary-action" onClick={props.onSave}>
          <span>{props.dirty ? "Save changes" : "Saved"}</span>
          <kbd>{displayShortcut("mod+s")}</kbd>
        </button>
      </div>
      <textarea
        ref={props.editorRef}
        value={props.text}
        onChange={(event) => props.onTextChange(event.target.value)}
        name="shortcut-lab-editor"
        aria-label="Shortcut Lab document"
        spellCheck
      />
    </div>
  )
}

// ─── Debug panel ─────────────────────────────────────────────────────────────

function DebugPanel(props: {
  events: ShortcutDebugEvent[]
  attempt: ShortcutAttemptDebugEvent | null
  recordedCombo: string | null
}) {
  return (
    <div className="panel-stack">
      <div className="panel-head">
        <div>
          <p className="eyebrow">debug</p>
          <h2>Runtime telemetry</h2>
        </div>
        <kbd>{displayShortcut("g then d")}</kbd>
      </div>

      <div className="debug-grid">
        <article className="debug-card">
          <p className="eyebrow">sequence attempt</p>
          <strong>{props.attempt?.status ?? "idle"}</strong>
          <span>{props.attempt?.display ?? "Type g then d from editor/global scope."}</span>
        </article>
        <article className="debug-card">
          <p className="eyebrow">recorded</p>
          <strong>{props.recordedCombo ? displayShortcut(props.recordedCombo) : "none"}</strong>
          <span>{props.recordedCombo ? describeParsedShortcut(props.recordedCombo) : "Use settings to record."}</span>
        </article>
      </div>

      <div className="event-table" role="table" aria-label="Recent debug events">
        {props.events.length === 0 ? (
          <p className="empty">Debug events appear here after any keypress.</p>
        ) : props.events.map((event, index) => (
          <div key={`${event.input.combo}-${index}`} role="row" className="event-row">
            <kbd>{displayShortcut(event.input.combo)}</kbd>
            <span>{event.input.code || "no code"}</span>
            <span>location {event.input.location}</span>
            <span>{event.attempts.length} attempts</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Settings panel ───────────────────────────────────────────────────────────

function SettingsPanel(props: {
  recording: boolean
  recordedCombo: string | null
  scope: ScopeName
  onRecord: () => void
  onScopeChange: (scope: ScopeName) => void
}) {
  return (
    <div className="panel-stack">
      <div className="panel-head">
        <div>
          <p className="eyebrow">settings</p>
          <h2>Shortcut control room</h2>
        </div>
        <button type="button" className="primary-action" onClick={props.onRecord} disabled={props.recording}>
          <span>{props.recording ? "Recording…" : "Record combo"}</span>
        </button>
      </div>

      <div className="settings-grid">
        <article>
          <p className="eyebrow">active scope</p>
          <div className="segmented" role="group" aria-label="Set active scope">
            {SCOPES.map((scope) => (
              <button
                key={scope}
                type="button"
                className={props.scope === scope ? "active" : ""}
                onClick={() => props.onScopeChange(scope)}
              >
                {scope}
              </button>
            ))}
          </div>
        </article>
        <article>
          <p className="eyebrow">last recording</p>
          <strong>{props.recordedCombo ? displayShortcut(props.recordedCombo) : "none"}</strong>
          <span>{props.recordedCombo ? describeParsedShortcut(props.recordedCombo) : "Click record and press a combo."}</span>
        </article>
      </div>
    </div>
  )
}

// ─── Intro panel ─────────────────────────────────────────────────────────────

const INTRO_SNIPPET = `
// one registry, reactive to your app's mode
const $ = useShortcut({ activeScopes: mode })

// fluent chain — pure until .on() registers
const save = $.mod.key("s").on(saveDoc, {
  scopes: "editor",
  preventDefault: true,
})

// every binding returns a live handle
save.display   // "Ctrl+S" or "⌘S"
save.trigger() // fire from a button
save.disable() // block while loading
save.onAttempt?.((matched) => showHint())

// sequences, multi-alias, guards
$.key("g").then("d").on(openDebug)
$.bind(["mod+k", "mod+p"]).on(openPalette)
$.bind("alt+s").except("typing").on(search)
`

const INTRO_PRINCIPLES = [
  {
    tag: "chain api",
    title: "Write intent, not config",
    body: "The fluent builder `$.mod.key().on()` reads exactly like what it does. Modifiers, guards, scopes, and sequences chain together purely — `.on()` is the only call that mutates the registry.",
  },
  {
    tag: "scopes",
    title: "Shortcuts that know when to be silent",
    body: "Activate and deactivate named scope sets at runtime with `$.setScopes()`. No if-guards cluttering your handlers, no re-registration when a modal opens or a panel changes.",
  },
  {
    tag: "result api",
    title: "Every binding is a live handle",
    body: "Registration returns a `ShortcutResult`: trigger it from a button, disable it while loading, subscribe to attempts for progress indicators. Full programmatic control after the fact.",
  },
] as const

function IntroPanel({ docsPath, onNavigate }: { docsPath: string; onNavigate: (panel: PanelName) => void }) {
  return (
    <div className="panel-stack">
      <div className="panel-head">
        <div>
          <p className="eyebrow">@remcostoeten/use-shortcut</p>
          <h2>keyboard shortcuts as first-class citizens</h2>
        </div>
        <kbd>{displayShortcut("g then h")}</kbd>
      </div>

      <p className="intro-lead">
        {prose(
          "Most shortcut libraries are thin wrappers around `addEventListener`. This one is built for the way React apps actually work — reactive scopes, fluent chains, and a live result handle on every binding. Register once, control forever.",
        )}
      </p>

      <div className="intro-principles">
        {INTRO_PRINCIPLES.map((p) => (
          <article key={p.tag} className="intro-principle">
            <p className="eyebrow">{p.tag}</p>
            <strong>{p.title}</strong>
            <p>{prose(p.body)}</p>
          </article>
        ))}
      </div>

      <div className="intro-code">
        <p className="eyebrow">quick look</p>
        <Code code={INTRO_SNIPPET} />
      </div>

      <div className="intro-explore">
        <p className="eyebrow">explore the lab</p>
        <div className="intro-nav">
          <button type="button" className="chip" onClick={() => onNavigate("chaining")}>
            chaining api
          </button>
          <button type="button" className="chip" onClick={() => onNavigate("groups")}>
            groups &amp; lifecycle
          </button>
          <Link to={`${docsPath}#api-reference`} className="chip">
            full reference
          </Link>
          <button type="button" className="chip" onClick={() => onNavigate("editor")}>
            editor demo
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Chaining panel ───────────────────────────────────────────────────────────
// Showcases: $.bind([...]) multi-combo, .except("typing"), programmatic result API

const CHAIN_ITEMS = ["alpha", "beta", "gamma", "delta", "epsilon"] as const

const CODE_MULTI_COMBO = `
// one handler, two trigger aliases
const result = $.bind(["alt+j", "alt+n"]).on(
  (event) => {
    console.log(event.key) // "j" or "n"
    advance()
  },
  { description: "Multi-combo" },
)

// combined ShortcutResult:
result.display  // "Alt+J / Alt+N"
result.trigger() // fires both aliases
result.unbind()  // removes both at once
`

const CODE_EXCEPT = `
// skip shortcut while typing in inputs
$.bind("alt+e").on(handler, {
  except: "typing",
})

// built-in presets:
// "input"    → <input>, <textarea>, <select>
// "editable" → contenteditable elements
// "typing"   → input + editable combined
// "modal"    → [role="dialog"] is open
// "disabled" → focused element is disabled

// or a custom predicate:
$.bind("alt+e").on(handler, {
  except: (e) => e.target instanceof HTMLInputElement,
})
`

const CODE_PROGRAMMATIC = `
const result = $.bind("alt+p").on(handler)

// trigger() always fires, even when disabled
result.trigger()

// keyboard events respect isEnabled
result.disable()   // → keypress ignored
result.enable()    // → keypress works again
result.isEnabled   // boolean
`

function ChainingPanel() {
  const [activeItem, setActiveItem] = useState(0)
  const [multiCount, setMultiCount] = useState(0)
  const [lastMultiKey, setLastMultiKey] = useState("")
  const [exceptEnabled, setExceptEnabled] = useState(false)
  const [exceptCount, setExceptCount] = useState(0)
  const [progCount, setProgCount] = useState(0)
  const [progEnabled, setProgEnabled] = useState(true)
  const progRef = useRef<ShortcutResult | null>(null)

  // Independent registry, always active on this scope.
  const $ = useShortcut({ activeScopes: "chaining", ignoreInputs: false })

  // Multi-combo: $.bind(["alt+j", "alt+n"]) — one handler, two aliases.
  useEffect(() => {
    const result = $.bind(["alt+j", "alt+n"]).on(
      (event) => {
        setLastMultiKey(event.key.toLowerCase())
        setMultiCount((n) => n + 1)
        setActiveItem((n) => (n + 1) % CHAIN_ITEMS.length)
      },
      { description: "Multi-combo: alt+j or alt+n", preventDefault: true },
    )
    return () => result.unbind()
  }, [$])

  // .except("typing"): re-registers when toggle changes.
  useEffect(() => {
    const result = $.bind("alt+e").on(
      () => setExceptCount((n) => n + 1),
      {
        description: "Except typing demo",
        ...(exceptEnabled ? { except: "typing" as const } : {}),
      },
    )
    return () => result.unbind()
  }, [$, exceptEnabled])

  // Programmatic control: .trigger() / .disable() / .enable()
  useEffect(() => {
    const result = $.bind("alt+p").on(
      () => setProgCount((n) => n + 1),
      { description: "Programmatic demo" },
    )
    progRef.current = result
    setProgEnabled(result.isEnabled)
    return () => {
      result.unbind()
      progRef.current = null
    }
  }, [$])

  return (
    <div className="panel-stack">
      <div className="panel-head">
        <div>
          <p className="eyebrow">chaining</p>
          <h2>API surface</h2>
        </div>
        <kbd>{displayShortcut("g then c")}</kbd>
      </div>

      <div className="demo-section">
        <p className="eyebrow">multi-combo — $.bind(["alt+j", "alt+n"]) — two aliases, one handler</p>
        <div className="demo-split">
          <div className="demo-body">
            <div className="demo-items">
              {CHAIN_ITEMS.map((item, i) => (
                <div key={item} className={`demo-item${i === activeItem ? " active" : ""}`}>
                  {item}
                </div>
              ))}
            </div>
            <div className="demo-row">
              <span className="empty">
                fired <strong>{multiCount}</strong>×
                {lastMultiKey ? ` — last via alt+${lastMultiKey}` : ""}
              </span>
            </div>
            <p className="empty">press <kbd>Alt+J</kbd> or <kbd>Alt+N</kbd></p>
          </div>
          <Code code={CODE_MULTI_COMBO} />
        </div>
      </div>

      <div className="demo-section">
        <p className="eyebrow">.except("typing") — skip shortcut when focused inside an input</p>
        <div className="demo-split">
          <div className="demo-body">
            <div className="demo-row">
              <span className="empty">fired <strong>{exceptCount}</strong>×</span>
              <button
                type="button"
                className={`chip${exceptEnabled ? " active" : ""}`}
                onClick={() => setExceptEnabled((e) => !e)}
              >
                except: typing {exceptEnabled ? "on" : "off"}
              </button>
            </div>
            <input
              className="demo-input"
              placeholder="focus here, then press Alt+E"
              aria-label="Test input for except demo"
            />
            <p className="empty">press <kbd>Alt+E</kbd> — when on, fires only outside this input</p>
          </div>
          <Code code={CODE_EXCEPT} />
        </div>
      </div>

      <div className="demo-section">
        <p className="eyebrow">programmatic — result.trigger() · result.disable() · result.enable()</p>
        <div className="demo-split">
          <div className="demo-body">
            <div className="demo-row">
              <span className="empty">fired <strong>{progCount}</strong>×</span>
              <span className={`status-badge${progEnabled ? "" : " muted"}`}>
                {progEnabled ? "enabled" : "disabled"}
              </span>
            </div>
            <div className="demo-row">
              <button
                type="button"
                className="chip"
                title="result.trigger() always fires regardless of isEnabled"
                onClick={() => progRef.current?.trigger()}
              >
                trigger
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => { progRef.current?.disable(); setProgEnabled(false) }}
                disabled={!progEnabled}
              >
                disable
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => { progRef.current?.enable(); setProgEnabled(true) }}
                disabled={progEnabled}
              >
                enable
              </button>
            </div>
            <p className="empty">press <kbd>Alt+P</kbd> — disabled blocks keypress; trigger() always fires</p>
          </div>
          <Code code={CODE_PROGRAMMATIC} />
        </div>
      </div>
    </div>
  )
}

// ─── Groups panel ─────────────────────────────────────────────────────────────
// Showcases: useShortcutGroup bulk lifecycle, onConflict, priority+stopOnMatch, delay

const GROUP_KEYS = ["1", "2", "3", "4"] as const

const CODE_GROUP = `
const group = useShortcutGroup()

// add shortcuts to the group
group.add($.bind("alt+1").on(handler1))
group.add($.bind("alt+2").on(handler2))
group.add($.bind("alt+3").on(handler3))
group.add($.bind("alt+4").on(handler4))

// remove all bindings atomically
group.unbindAll()

// or use addMany() with a map result
const results = registerShortcutMap($, map)
group.addMany(results)
`

const CODE_CONFLICT_PRIORITY = `
const $ = useShortcut({
  onConflict: (conflict) => {
    // conflict.combo      → "alt+h"
    // conflict.reason     → "exact"
    //                       "sequence-prefix"
    console.log(conflict)
  },
  conflictWarnings: false, // silence console
})

// high priority wins; low is blocked
$.bind("alt+h").on(highHandler, {
  priority: 10,
  stopOnMatch: true,
})
$.bind("alt+h").on(lowHandler, {
  priority: 0,
})
`

const CODE_DELAY = `
const result = $.bind("alt+d").on(
  handler,
  { delay: 800 }, // ms after keypress
)

// onAttempt fires immediately on match —
// before the delay window expires
result.onAttempt?.((matched) => {
  if (matched) setPending(true)
})
// handler fires 800ms later,
// clearing the pending state
`

function GroupsPanel() {
  const [groupBound, setGroupBound] = useState(true)
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<ShortcutConflict[]>([])
  const [priorityFired, setPriorityFired] = useState<"high" | "low" | null>(null)
  const [delayPending, setDelayPending] = useState(false)
  const [delayCount, setDelayCount] = useState(0)

  const $ = useShortcut({
    activeScopes: "groups",
    ignoreInputs: false,
    onConflict: (c) => setConflicts((prev) => {
      if (prev.some((x) => x.combo === c.combo && x.reason === c.reason)) return prev
      return [c, ...prev].slice(0, 3)
    }),
    conflictWarnings: false,
  })

  const group = useShortcutGroup()

  // useShortcutGroup: register alt+1..4 as one unit; unbind/rebind together.
  useEffect(() => {
    if (!groupBound) return

    for (const key of GROUP_KEYS) {
      group.add(
        $.bind(`alt+${key}`).on(
          () => setActiveGroupKey(key),
          { description: `Group item ${key}` },
        ),
      )
    }

    return () => group.unbindAll()
  }, [$, group, groupBound])

  // priority + stopOnMatch: two handlers for alt+h. Conflict is emitted; high wins.
  useEffect(() => {
    const high = $.bind("alt+h").on(
      () => setPriorityFired("high"),
      { priority: 10, stopOnMatch: true, description: "High priority (fires, stops)" },
    )
    const low = $.bind("alt+h").on(
      () => setPriorityFired("low"),
      { priority: 0, description: "Low priority (blocked by stopOnMatch)" },
    )
    return () => { high.unbind(); low.unbind() }
  }, [$])

  // delay: handler fires 800ms after keypress; onAttempt signals the pending window.
  useEffect(() => {
    const result = $.bind("alt+d").on(
      () => { setDelayPending(false); setDelayCount((n) => n + 1) },
      { delay: 800, description: "Delayed 800ms" },
    )
    result.onAttempt?.((matched) => {
      if (matched) setDelayPending(true)
    })
    return () => result.unbind()
  }, [$])

  return (
    <div className="panel-stack">
      <div className="panel-head">
        <div>
          <p className="eyebrow">groups</p>
          <h2>Lifecycle &amp; control</h2>
        </div>
        <kbd>{displayShortcut("g then g")}</kbd>
      </div>

      <div className="demo-section">
        <p className="eyebrow">useShortcutGroup — group.add() · group.unbindAll() — alt+1..4</p>
        <div className="demo-split">
          <div className="demo-body">
            <div className="demo-row">
              {GROUP_KEYS.map((k) => (
                <div
                  key={k}
                  className={`demo-item${activeGroupKey === k ? " active" : ""}${!groupBound ? " faint" : ""}`}
                >
                  alt+{k}
                </div>
              ))}
              <button
                type="button"
                className="chip"
                onClick={() => setGroupBound(false)}
                disabled={!groupBound}
              >
                unbind all
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => setGroupBound(true)}
                disabled={groupBound}
              >
                rebind
              </button>
            </div>
            <p className="empty">
              {groupBound
                ? "press alt+1..4 — registered as one group"
                : "unbound — rebind to restore all four at once"}
            </p>
          </div>
          <Code code={CODE_GROUP} />
        </div>
      </div>

      <div className="demo-section">
        <p className="eyebrow">onConflict + priority + stopOnMatch — alt+h registered twice</p>
        <div className="demo-split">
          <div className="demo-body">
            <div className="debug-grid">
              <article className="debug-card">
                <p className="eyebrow">last fired</p>
                <strong>{priorityFired ?? "—"}</strong>
                <span>
                  {priorityFired === "high"
                    ? "priority 10 ran; low was stopped"
                    : priorityFired === "low"
                      ? "low ran (unexpected)"
                      : "press alt+h"}
                </span>
              </article>
              <article className="debug-card">
                <p className="eyebrow">conflicts ({conflicts.length})</p>
                <strong>{conflicts.length > 0 ? conflicts[0].reason : "none yet"}</strong>
                {conflicts.map((c, i) => (
                  <span key={i} className="status-badge warn">{c.reason}: {c.combo}</span>
                ))}
              </article>
            </div>
          </div>
          <Code code={CODE_CONFLICT_PRIORITY} />
        </div>
      </div>

      <div className="demo-section">
        <p className="eyebrow">delay — handler fires 800ms after keypress — alt+d</p>
        <div className="demo-split">
          <div className="demo-body">
            <div className="demo-row">
              <span className="empty">fired <strong>{delayCount}</strong>×</span>
              {delayPending ? <span className="status-badge ok">pending 800ms…</span> : null}
            </div>
            <p className="empty">press <kbd>Alt+D</kbd> — watch the pending indicator appear, then resolve</p>
          </div>
          <Code code={CODE_DELAY} />
        </div>
      </div>
    </div>
  )
}

