import type { ShortcutRecordingOptions } from "../types"
import { _eventToCombo } from "./keys"
import { _isPureModifier } from "./guards"
import type { ShortcutRegistry } from "./types"

export function _createRecorder(registry: ShortcutRegistry) {
    return (recordingOptions: ShortcutRecordingOptions = {}): Promise<string> => {
        return new Promise((resolve, reject) => {
            const options = registry.options
            const target = recordingOptions.target ?? options.target ?? (typeof window !== "undefined" ? window : null)
            const eventType = recordingOptions.eventType ?? options.eventType ?? "keydown"
            const signal = recordingOptions.signal

            if (!target) {
                reject(new Error("[useShortcut] Cannot record shortcut without a target."))
                return
            }

            if (signal?.aborted) {
                reject(new Error("[useShortcut] Recording aborted."))
                return
            }

            let timeout: ReturnType<typeof setTimeout> | undefined

            const cleanup = () => {
                target.removeEventListener(eventType, listener as EventListener)
                if (timeout) clearTimeout(timeout)
                signal?.removeEventListener("abort", onAbort)
                registry.pendingRecordings.delete(cancel)
            }

            const cancel = () => {
                cleanup()
                reject(new Error("[useShortcut] Recording aborted."))
            }

            const onAbort = () => cancel()

            const listener = (event: Event) => {
                const keyboardEvent = event as KeyboardEvent
                if (_isPureModifier(keyboardEvent)) return

                keyboardEvent.preventDefault()
                cleanup()
                resolve(_eventToCombo(keyboardEvent))
            }

            target.addEventListener(eventType, listener as EventListener)
            registry.pendingRecordings.add(cancel)
            signal?.addEventListener("abort", onAbort, { once: true })

            const timeoutMs = recordingOptions.timeoutMs
            if (timeoutMs && timeoutMs > 0) {
                timeout = setTimeout(() => {
                    cleanup()
                    reject(new Error(`[useShortcut] Recording timed out after ${timeoutMs}ms.`))
                }, timeoutMs)
            }
        })
    }
}
