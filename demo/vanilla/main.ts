import { createShortcuts, detectPlatform } from "@remcostoeten/use-shortcut"
import type {
    Handle,
    HoldEvent,
    Platform,
    Registry,
    ShortcutEvent,
} from "@remcostoeten/use-shortcut"

type LogEntry = { combo: string; phase: string; duration: string }

const VISUAL_MODIFIERS = ["ctrl", "alt", "shift", "meta"] as const
type VisualModifier = (typeof VISUAL_MODIFIERS)[number]

const MODIFIER_LABELS: Record<Platform, Record<VisualModifier, string>> = {
    mac: { ctrl: "⌃", alt: "⌥", shift: "⇧", meta: "⌘" },
    other: { ctrl: "Ctrl", alt: "Alt", shift: "Shift", meta: "Win" },
}
const MODIFIER_KEYS = new Set(["Control", "Alt", "Shift", "Meta"])
const FLASH_MS = 300
const PEEK_LINGER_MS = 400
const LOG_LIMIT = 12

function must<T extends Element>(selector: string, type: new () => T): T {
    const element = document.querySelector(selector)
    if (element instanceof type) return element
    throw new Error(`Missing ${selector}`)
}

const page = must("#page", HTMLElement)
const jumpCount = must("#jump-count", HTMLElement)
const palette = must("#palette", HTMLElement)
const paletteInput = must("#palette-input", HTMLInputElement)
const peek = must("#peek", HTMLElement)
const peekTime = must("#peek-time", HTMLElement)
const bindingsList = must("#bindings", HTMLElement)
const logList = must("#log", HTMLElement)
const editorToggle = must("#editor-toggle", HTMLInputElement)
const lastKey = must("#last-key", HTMLElement)

const entries: LogEntry[] = []
let jumps = 0
let peekTimer = 0

function cell(text: string): HTMLSpanElement {
    const span = document.createElement("span")
    span.textContent = text
    return span
}

function row(name: string): HTMLElement {
    return must(`[data-row="${name}"]`, HTMLElement)
}

function label(name: string, handle: Handle) {
    must(`[data-row="${name}"] [data-keys]`, HTMLElement).textContent = handle.display
}

function flash(name: string) {
    const dot = must(`[data-row="${name}"] [data-dot]`, HTMLElement)
    dot.classList.add("is-hit")
    setTimeout(() => dot.classList.remove("is-hit"), FLASH_MS)
}

function toEntry(event: ShortcutEvent): LogEntry {
    if ("phase" in event) {
        const duration = `${Math.round(event.duration)} ms`
        return { combo: event.combo, phase: event.phase, duration }
    }
    return { combo: event.combo, phase: "press", duration: "" }
}

function renderLog() {
    if (entries.length === 0) {
        const empty = cell("Press something")
        empty.className = "empty"
        logList.replaceChildren(empty)
        return
    }
    logList.replaceChildren(
        ...entries.map((entry) => {
            const item = document.createElement("li")
            item.append(cell(entry.combo), cell(entry.phase), cell(entry.duration))
            return item
        }),
    )
}

function record(event: ShortcutEvent) {
    entries.unshift(toEntry(event))
    entries.splice(LOG_LIMIT)
    renderLog()
}

function fire<Event extends ShortcutEvent>(name: string, action: (event: Event) => void) {
    return (event: Event) => {
        action(event)
        flash(name)
        record(event)
    }
}

function renderBindings(registry: Registry) {
    bindingsList.replaceChildren(
        ...registry.list().map((binding) => {
            const item = document.createElement("li")
            const keys = document.createElement("kbd")
            keys.textContent = binding.display
            item.append(keys, cell(binding.description))
            return item
        }),
    )
}

function openPalette() {
    palette.hidden = false
    paletteInput.focus()
}

function closePalette() {
    palette.hidden = true
    paletteInput.value = ""
    paletteInput.blur()
}

function setPage(name: string) {
    page.textContent = name
}

function closeOrClear() {
    if (palette.hidden) setPage("No page")
    else closePalette()
}

function countJump() {
    jumps += 1
    jumpCount.textContent = String(jumps)
}

function toggleBold() {
    page.classList.toggle("is-bold")
}

function onPeek(event: HoldEvent) {
    window.clearInterval(peekTimer)
    if (event.phase === "start") {
        const pressedAt = performance.now() - event.duration
        peek.classList.add("is-open")
        peekTimer = window.setInterval(() => {
            peekTime.textContent = `${Math.round(performance.now() - pressedAt)} ms`
        }, 50)
        return
    }
    peekTime.textContent = `${Math.round(event.duration)} ms`
    peekTimer = window.setTimeout(() => peek.classList.remove("is-open"), PEEK_LINGER_MS)
}

function defineShortcuts(): Registry {
    const { shortcut, registry } = createShortcuts({ scopes: ["editor"] })

    const handles = {
        palette: shortcut.mod
            .key("k")
            .describe("Open the command palette")
            .on(fire("palette", openPalette)),
        dashboard: shortcut
            .key("g")
            .then.key("d")
            .describe("Go to Dashboard")
            .on(fire("dashboard", () => setPage("Dashboard"))),
        settings: shortcut
            .key("g")
            .then.key("s")
            .describe("Go to Settings")
            .on(fire("settings", () => setPage("Settings"))),
        peek: shortcut.hold("space").describe("Peek while held").on(fire("peek", onPeek)),
        jump: shortcut
            .key("j")
            .then.wait(300)
            .key("k")
            .describe("Count a jump")
            .on(fire("jump", countJump)),
        close: shortcut
            .key("escape")
            .or.mod.key("d")
            .allowInInputs()
            .describe("Close the palette or clear the page")
            .on(fire("close", closeOrClear)),
        bold: shortcut.mod
            .key("b")
            .in("editor")
            .describe("Bold the page label")
            .on(fire("bold", toggleBold)),
    }

    Object.entries(handles).forEach(([name, handle]) => label(name, handle))
    return registry
}

function isModifierDown(event: KeyboardEvent, name: VisualModifier): boolean {
    if (name === "ctrl") return event.ctrlKey
    if (name === "alt") return event.altKey
    if (name === "shift") return event.shiftKey
    return event.metaKey
}

function wireVisualizer() {
    const labels = MODIFIER_LABELS[detectPlatform()]
    const caps = VISUAL_MODIFIERS.map((name) => {
        const cap = must(`[data-modifier="${name}"]`, HTMLElement)
        cap.textContent = labels[name]
        return { name, cap }
    })
    function update(event: KeyboardEvent) {
        caps.forEach(({ name, cap }) =>
            cap.classList.toggle("is-down", isModifierDown(event, name)),
        )
    }
    window.addEventListener("keydown", (event) => {
        update(event)
        if (MODIFIER_KEYS.has(event.key)) return
        lastKey.textContent = event.key === " " ? "space" : event.key
        lastKey.classList.add("is-down")
    })
    window.addEventListener("keyup", (event) => {
        update(event)
        if (!MODIFIER_KEYS.has(event.key)) lastKey.classList.remove("is-down")
    })
    window.addEventListener("blur", () => {
        caps.forEach(({ cap }) => cap.classList.remove("is-down"))
        lastKey.classList.remove("is-down")
    })
}

function main() {
    wireVisualizer()
    const registry = defineShortcuts()
    function sync() {
        renderBindings(registry)
        const editorOn = registry.isEnabled("editor")
        editorToggle.checked = editorOn
        row("bold").classList.toggle("is-off", !editorOn)
    }
    registry.subscribe(sync)
    sync()
    renderLog()
    editorToggle.addEventListener("change", () => {
        if (editorToggle.checked) registry.enable("editor")
        else registry.disable("editor")
    })
    palette.addEventListener("click", (event) => {
        if (event.target === palette) closePalette()
    })
}

main()
