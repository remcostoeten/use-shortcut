import type { ShortcutRecordingOptions, UseShortcutOptions } from "../types"
import { _eventToCombo } from "./keys"
import { _isPureModifier } from "./guards"

export function _createRecorder(options: UseShortcutOptions) {
    return (recordingOptions: ShortcutRecordingOptions = {}): Promise<string> => {
        return new Promise((resolve, reject) => {
            const target = recordingOptions.target ?? options.target ?? (typeof window !== "undefined" ? window : null)
            const eventType = recordingOptions.eventType ?? options.eventType ?? "keydown"

            if (!target) {
                reject(new Error("[useShortcut] Cannot record shortcut without a target."))
                return
            }

            let timeout: ReturnType<typeof setTimeout> | undefined

            const listener = (event: Event) => {
                const keyboardEvent = event as KeyboardEvent
                if (_isPureModifier(keyboardEvent)) return

                keyboardEvent.preventDefault()
                target.removeEventListener(eventType, listener as EventListener)
                if (timeout) clearTimeout(timeout)
                resolve(_eventToCombo(keyboardEvent))
            }

            target.addEventListener(eventType, listener as EventListener)

            const timeoutMs = recordingOptions.timeoutMs
            if (timeoutMs && timeoutMs > 0) {
                timeout = setTimeout(() => {
                    target.removeEventListener(eventType, listener as EventListener)
                    reject(new Error(`[useShortcut] Recording timed out after ${timeoutMs}ms.`))
                }, timeoutMs)
            }
        })
    }
}
