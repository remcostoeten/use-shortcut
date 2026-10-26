import { useState } from "react"
import { ShortcutProvider, shortcut, useShortcutList } from "./shortcuts"
import type { Log } from "./types"

type Props = {
    log: Log
}

function RegionBindings() {
    const bindings = useShortcutList()
    return (
        <p className="muted small">
            This region lists {bindings.length} binding{bindings.length === 1 ? "" : "s"} of its
            own: {bindings.map((binding) => binding.display).join(", ")}
        </p>
    )
}

function EditorSurface(props: Props) {
    const [bold, setBold] = useState(false)
    const [text, setText] = useState("Select this text area and press the combo.")
    const handle = shortcut.mod
        .key("b")
        .in("editor")
        .allowInInputs()
        .describe("Toggle bold in the editor")
        .on(() => {
            setBold((previous) => !previous)
            props.log("mod+b (editor region)")
        })

    return (
        <div className="editor-surface">
            <div className="row">
                <kbd className="keycap">{handle.display}</kbd>
                <span className="muted">
                    scope <code>editor</code>, bound inside a nested provider
                </span>
                <span className="state" data-on={bold}>
                    {bold ? "bold" : "regular"}
                </span>
            </div>
            <textarea
                className="editor-text"
                data-bold={bold}
                rows={3}
                value={text}
                onChange={(event) => setText(event.target.value)}
            />
            <RegionBindings />
        </div>
    )
}

export function Editor(props: Props) {
    const [mounted, setMounted] = useState(true)
    return (
        <section className="panel">
            <div className="row space-between">
                <h2>Editor region</h2>
                <label className="toggle">
                    <input
                        type="checkbox"
                        checked={mounted}
                        onChange={(event) => setMounted(event.target.checked)}
                    />
                    Mount the editor
                </label>
            </div>
            <p className="muted">
                A nested <code>ShortcutProvider</code> is an isolated region. Outer shortcuts stay
                out of it, except the ones it inherits (here only <code>mod+k</code>). Unmount it
                and its binding is gone.
            </p>
            {mounted ? (
                <ShortcutProvider scopes={["editor"]} inherit={["mod+k"]}>
                    <EditorSurface log={props.log} />
                </ShortcutProvider>
            ) : (
                <p className="muted small">The editor is unmounted, so is its binding.</p>
            )}
        </section>
    )
}
