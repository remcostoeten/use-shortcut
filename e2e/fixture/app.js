import { createShortcuts } from "./dist/index.js"

const log = document.getElementById("log")
const keys = document.getElementById("keys")
const modal = document.getElementById("modal")

function append(target, line) {
    target.textContent += `${line}\n`
}

function logPress(event) {
    append(log, `${event.combo} press`)
}

function logHold(event) {
    append(log, `${event.combo} ${event.phase} ${Math.round(event.duration)}`)
}

const { shortcut } = createShortcuts({ holdThreshold: 200, sequenceTimeout: 1000 })

shortcut.mod.key("k").on(logPress)
shortcut.key("s").on(logPress)
shortcut.key("t").allowInInputs().on(logPress)
shortcut.key("g").then.key("d").on(logPress)
shortcut.hold("c").on(logHold)
shortcut.key("h").on(logPress)
shortcut.hold("h").on(logHold)
shortcut.key("m").except("modal").on(logPress)
shortcut.hold("space").on(logHold)

window.addEventListener("keydown", (event) => {
    append(keys, `keydown ${event.key} repeat=${event.repeat} prevented=${event.defaultPrevented}`)
})
window.addEventListener("blur", () => append(keys, "window blur"))
document.addEventListener("visibilitychange", () =>
    append(keys, `visibility ${document.visibilityState}`),
)

document.getElementById("open-modal").addEventListener("click", () => modal.showModal())
document.getElementById("close-modal").addEventListener("click", () => modal.close())
