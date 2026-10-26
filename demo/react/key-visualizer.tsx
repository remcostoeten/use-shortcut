import { useEffect, useState } from "react"
import { detectPlatform } from "@remcostoeten/use-shortcut"

type Held = {
    ctrl: boolean
    alt: boolean
    shift: boolean
    meta: boolean
    key: string
    keyDown: boolean
}

const IDLE: Held = { ctrl: false, alt: false, shift: false, meta: false, key: "", keyDown: false }

const MODIFIER_KEYS = new Set(["Control", "Alt", "Shift", "Meta"])

const LABELS = {
    mac: { ctrl: "⌃", alt: "⌥", shift: "⇧", meta: "⌘" },
    other: { ctrl: "Ctrl", alt: "Alt", shift: "Shift", meta: "Win" },
} as const

function labelOf(key: string): string {
    if (key === " ") return "Space"
    if (key.length === 1) return key.toUpperCase()
    return key.replace("Arrow", "").replace("Escape", "Esc")
}

export function KeyVisualizer() {
    const [held, setHeld] = useState<Held>(IDLE)
    const labels = LABELS[detectPlatform()]

    useEffect(() => {
        function onDown(event: KeyboardEvent) {
            setHeld((previous) => ({
                ctrl: event.ctrlKey,
                alt: event.altKey,
                shift: event.shiftKey,
                meta: event.metaKey,
                key: MODIFIER_KEYS.has(event.key) ? previous.key : labelOf(event.key),
                keyDown: MODIFIER_KEYS.has(event.key) ? previous.keyDown : true,
            }))
        }
        function onUp(event: KeyboardEvent) {
            setHeld((previous) => ({
                ctrl: event.ctrlKey && event.key !== "Control",
                alt: event.altKey && event.key !== "Alt",
                shift: event.shiftKey && event.key !== "Shift",
                meta: event.metaKey && event.key !== "Meta",
                key: previous.key,
                keyDown: MODIFIER_KEYS.has(event.key) ? previous.keyDown : false,
            }))
        }
        function onBlur() {
            setHeld(IDLE)
        }
        window.addEventListener("keydown", onDown, true)
        window.addEventListener("keyup", onUp, true)
        window.addEventListener("blur", onBlur)
        return () => {
            window.removeEventListener("keydown", onDown, true)
            window.removeEventListener("keyup", onUp, true)
            window.removeEventListener("blur", onBlur)
        }
    }, [])

    return (
        <section className="panel visualizer" aria-label="Keys currently held">
            <span className="pill" data-lit={held.ctrl}>
                {labels.ctrl}
            </span>
            <span className="pill" data-lit={held.alt}>
                {labels.alt}
            </span>
            <span className="pill" data-lit={held.shift}>
                {labels.shift}
            </span>
            <span className="pill" data-lit={held.meta}>
                {labels.meta}
            </span>
            <span className="pill pill-key" data-lit={held.keyDown}>
                {held.key === "" ? "…" : held.key}
            </span>
        </section>
    )
}
