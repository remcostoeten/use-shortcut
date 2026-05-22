import React, { useEffect, useMemo, useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import {
  formatShortcut,
  parseShortcut,
  useShortcut,
  useShortcutBinding,
  useShortcutMap,
  type ShortcutAttemptDebugEvent,
  type ShortcutDebugEvent,
  type ShortcutMap,
} from "@remcostoeten/use-shortcut"
import "./styles.css"

type ScopeName = "global" | "editor" | "palette"
type PanelName = "editor" | "debug" | "settings"

type Activity = {
  id: number
  label: string
  combo: string
  detail: string
}

const PANELS: PanelName[] = ["editor", "debug", "settings"]
const SCOPES: ScopeName[] = ["global", "editor", "palette"]
const STORAGE_KEY = "shortcut-lab-document"

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

  return {
    panel: PANELS.includes(panel as PanelName) ? (panel as PanelName) : "editor",
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

function App() {
  const initialState = useMemo(readSearchState, [])
  const [panel, setPanel] = useState<PanelName>(initialState.panel)
  const [scope, setScope] = useState<ScopeName>(initialState.scope)
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

  useEffect(() => {
    documentTextRef.current = documentText
  }, [documentText])

  useEffect(() => {
    savedTextRef.current = savedText
  }, [savedText])

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

  useEffect(() => {
    $.setScopes(scope)
  }, [$, scope])

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
  }), [])

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
    { label: "Open editor", combo: "g then e", action: () => setPanelAndScope("editor", "editor", "palette") },
    { label: "Open debug", combo: "g then d", action: () => setPanelAndScope("debug", "global", "palette") },
    { label: "Open settings", combo: "g then s", action: () => setPanelAndScope("settings", "global", "palette") },
    { label: "Save document", combo: "mod+s", action: saveDocument },
  ]

  return (
    <main id="main" className="lab-shell">
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
              <kbd>{item === "debug" ? "g d" : item === "settings" ? "g s" : "esc"}</kbd>
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
  )
}

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

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
