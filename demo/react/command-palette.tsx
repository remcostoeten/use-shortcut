import { useState } from "react"
import { createPortal } from "react-dom"
import { shortcut } from "./shortcuts"
import type { Log } from "./types"

type Props = {
    onClose: () => void
    log: Log
}

const COMMANDS = ["Go to dashboard", "Go to settings", "Toggle sidebar"] as const

export function CommandPalette(props: Props) {
    const [query, setQuery] = useState("")
    const escape = shortcut
        .key("escape")
        .allowInInputs()
        .priority(1)
        .describe("Close the palette")
        .on(() => {
            props.log("escape (inside the palette input)")
            props.onClose()
        })

    const matches = COMMANDS.filter((command) =>
        command.toLowerCase().includes(query.trim().toLowerCase()),
    )

    function run(command: string) {
        props.log(`palette: ${command}`)
        props.onClose()
    }

    return createPortal(
        <div className="palette-backdrop" onClick={props.onClose}>
            <div
                className="palette"
                role="dialog"
                aria-label="Command palette"
                onClick={(event) => event.stopPropagation()}
            >
                <input
                    autoFocus
                    className="palette-input"
                    placeholder="Type a command, try typing g then d here"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                        const first = matches[0]
                        if (event.key === "Enter" && first !== undefined) run(first)
                    }}
                />
                <ul className="palette-list">
                    {matches.map((command) => (
                        <li key={command}>
                            <button type="button" onClick={() => run(command)}>
                                {command}
                            </button>
                        </li>
                    ))}
                    {matches.length === 0 && <li className="muted">No matches</li>}
                </ul>
                <p className="palette-hint">
                    <kbd className="keycap">{escape.display}</kbd> closes. Letters typed here never
                    start a sequence.
                </p>
            </div>
        </div>,
        document.body,
    )
}
