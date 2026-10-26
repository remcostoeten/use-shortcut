import type { LogEntry } from "./types"

type Props = {
    entries: readonly LogEntry[]
}

export function EventLog(props: Props) {
    return (
        <section className="panel">
            <h2>Event log</h2>
            {props.entries.length === 0 ? (
                <p className="muted">Nothing yet. Press a shortcut.</p>
            ) : (
                <ol className="log">
                    {props.entries.map((entry) => (
                        <li key={entry.id}>
                            <span className="log-time">{entry.at}</span>
                            <span>{entry.text}</span>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    )
}
