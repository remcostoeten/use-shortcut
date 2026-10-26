import { useState } from "react"
import { ShortcutBoundary } from "./shortcuts"

export function MutedCard() {
    const [muted, setMuted] = useState(false)
    return (
        <ShortcutBoundary disabled={muted}>
            <section className="panel" data-muted={muted}>
                <div className="row space-between">
                    <h2>Boundary</h2>
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={muted}
                            onChange={(event) => setMuted(event.target.checked)}
                        />
                        Mute shortcuts in this card
                    </label>
                </div>
                <p className="muted">
                    <code>ShortcutBoundary disabled</code> stops keydowns from reaching the
                    provider. Focus the button, then try <kbd className="keycap">G D</kbd>.
                </p>
                <button type="button" className="button">
                    Focus me
                </button>
            </section>
        </ShortcutBoundary>
    )
}
