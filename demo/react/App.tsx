import { useState } from "react"
import { BindingList } from "./binding-list"
import { CommandPalette } from "./command-palette"
import { Editor } from "./editor"
import { EventLog } from "./event-log"
import { KeyVisualizer } from "./key-visualizer"
import { MutedCard } from "./muted-card"
import { shortcut } from "./shortcuts"
import { TryRow } from "./try-row"
import type { LogEntry } from "./types"

type Page = "Dashboard" | "Settings"

type Peek = {
    holding: boolean
    lastDuration: number
}

const LOG_SIZE = 12

function timestamp(): string {
    return new Date().toLocaleTimeString(undefined, { hour12: false })
}

export function App() {
    const [page, setPage] = useState<Page>("Dashboard")
    const [paletteOpen, setPaletteOpen] = useState(false)
    const [jumps, setJumps] = useState(0)
    const [peek, setPeek] = useState<Peek>({ holding: false, lastDuration: 0 })
    const [entries, setEntries] = useState<readonly LogEntry[]>([])
    const [fired, setFired] = useState<Record<string, number>>({})

    function log(text: string) {
        const at = timestamp()
        setEntries((previous) => {
            const entry: LogEntry = { id: (previous[0]?.id ?? 0) + 1, at, text }
            return [entry, ...previous].slice(0, LOG_SIZE)
        })
    }

    function mark(name: string) {
        setFired((previous) => ({ ...previous, [name]: performance.now() }))
    }

    function firedAt(name: string): number {
        return fired[name] ?? 0
    }

    const palette = shortcut.mod
        .key("k")
        .describe("Open the command palette")
        .on(() => {
            mark("palette")
            log("mod+k: palette opened")
            setPaletteOpen(true)
        })

    const dashboard = shortcut
        .key("g")
        .then.key("d")
        .describe("Go to the dashboard")
        .on(() => {
            mark("dashboard")
            log("g then d: page = Dashboard")
            setPage("Dashboard")
        })

    const settings = shortcut
        .key("g")
        .then.key("s")
        .describe("Go to settings")
        .on(() => {
            mark("settings")
            log("g then s: page = Settings")
            setPage("Settings")
        })

    const hold = shortcut
        .hold("space")
        .describe("Peek while held")
        .on(({ phase, duration }) => {
            mark("hold")
            if (phase === "start") {
                log("hold space: start")
                setPeek({ holding: true, lastDuration: 0 })
                return
            }
            log(`hold space: release after ${Math.round(duration)} ms`)
            setPeek({ holding: false, lastDuration: Math.round(duration) })
        })

    const jump = shortcut
        .key("j")
        .then.wait(300)
        .key("k")
        .describe("Count a slow j, k")
        .on(() => {
            mark("jump")
            log("j, wait 300 ms, k: counter + 1")
            setJumps((previous) => previous + 1)
        })

    const reset = shortcut
        .key("escape")
        .or.mod.key("d")
        .describe("Close the palette or reset the page")
        .on(({ combo }) => {
            mark("reset")
            if (paletteOpen) {
                log(`${combo}: palette closed`)
                setPaletteOpen(false)
                return
            }
            log(`${combo}: page reset`)
            setPage("Dashboard")
            setJumps(0)
        })

    const jumpEnabled = jump.isEnabled()

    return (
        <main className="app">
            <header className="header">
                <h1>use-shortcut</h1>
                <p className="muted">Keyboard shortcuts for React and plain JavaScript.</p>
            </header>

            <KeyVisualizer />

            <section className="panel">
                <h2>Try these</h2>
                <ul className="try-list">
                    <TryRow
                        display={palette.display}
                        description="Opens a command palette rendered through a portal"
                        firedAt={firedAt("palette")}
                    />
                    <TryRow
                        display={dashboard.display}
                        description="Sequence: switch to the dashboard"
                        firedAt={firedAt("dashboard")}
                    />
                    <TryRow
                        display={settings.display}
                        description="Sequence: switch to settings"
                        firedAt={firedAt("settings")}
                    >
                        <span className="state">page: {page}</span>
                    </TryRow>
                    <TryRow
                        display={hold.display}
                        description="Hold: a peek panel while the key is down"
                        firedAt={firedAt("hold")}
                    >
                        {peek.lastDuration > 0 && (
                            <span className="state">last hold {peek.lastDuration} ms</span>
                        )}
                    </TryRow>
                    <TryRow
                        display={jump.display}
                        description="Wait: k has to come at least 300 ms after j"
                        firedAt={firedAt("jump")}
                    >
                        <span className="state">count: {jumps}</span>
                        <span className="state" data-on={jumpEnabled}>
                            isEnabled() {jumpEnabled ? "true" : "false"}
                        </span>
                        <button type="button" className="button small" onClick={jump.enable}>
                            enable
                        </button>
                        <button type="button" className="button small" onClick={jump.disable}>
                            disable
                        </button>
                    </TryRow>
                    <TryRow
                        display={reset.display}
                        description="Alternatives: close the palette, or reset page and counter"
                        firedAt={firedAt("reset")}
                    />
                </ul>
            </section>

            <div className="grid">
                <Editor log={log} />
                <MutedCard />
            </div>

            <div className="grid">
                <BindingList title="Active bindings" />
                <EventLog entries={entries} />
            </div>

            <section className="panel">
                <label className="label" htmlFor="quiet">
                    Type here: shortcuts stay quiet
                </label>
                <textarea
                    id="quiet"
                    className="quiet"
                    rows={3}
                    placeholder="g d, j k and space do nothing in here"
                />
            </section>

            {peek.holding && (
                <aside className="peek" role="status">
                    Peeking. Release Space to close.
                </aside>
            )}

            {paletteOpen && <CommandPalette log={log} onClose={() => setPaletteOpen(false)} />}
        </main>
    )
}
