import { useBinding, useRegistry } from "../../src/react"
import type { StepInput } from "../../src/core/step"
import type { Handle, Registry, ShortcutEvent } from "../../src/registry/registry"
import type { KeyName, Modifier, Nullable } from "../../src/shared/types/semantic"

type Box<Value> = { current: Nullable<Value> }

type Props = {
    steps: readonly StepInput[]
    onFire: (event: ShortcutEvent) => void
    onHandle?: (handle: Handle) => void
}

export function press(key: KeyName, ...modifiers: Modifier[]): StepInput {
    return { kind: "press", key, modifiers }
}

export function key(
    type: "keydown" | "keyup",
    key: string,
    target: EventTarget,
    init: KeyboardEventInit = {},
): KeyboardEvent {
    const event = new KeyboardEvent(type, { key, cancelable: true, bubbles: true, ...init })
    target.dispatchEvent(event)
    return event
}

export function tap(name: string, target: EventTarget, init: KeyboardEventInit = {}): void {
    key("keydown", name, target, init)
    key("keyup", name, target, init)
}

export function byId(id: string): HTMLElement {
    const element = document.getElementById(id)
    if (element === null) throw new Error(`no element #${id}`)
    return element
}

export function recorder() {
    const calls: ShortcutEvent[] = []
    return { calls, handler: (event: ShortcutEvent) => calls.push(event) }
}

export function Bind(props: Props) {
    const handle = useBinding({ steps: props.steps }, props.onFire)
    props.onHandle?.(handle)
    return null
}

export function Capture(props: { onRegistry: (registry: Registry) => void }) {
    props.onRegistry(useRegistry())
    return null
}

export function silenceWarnings() {
    const warnings: string[] = []
    const previous = console.warn
    console.warn = (message: string) => warnings.push(message)
    function restore() {
        console.warn = previous
    }
    return { warnings, restore }
}

export function box<Value>(): Box<Value> {
    return { current: null }
}
