import type {
    ModifierFlags,
    ShortcutHandler,
    UseShortcutOptions,
    ExceptPreset,
    ExceptPredicate,
    ShortcutScope,
    ParsedShortcut,
    ShortcutDebugEvent,
    ShortcutAttemptDebugEvent,
} from "../types"

export type BuilderState = {
    modifiers: Partial<ModifierFlags>
    steps: string[]
    boundCombos?: string[]
    options: UseShortcutOptions
    except?: ExceptPreset | ExceptPreset[] | ExceptPredicate
    scopes?: ShortcutScope
}

export type RegistryEntry = {
    id: number
    userHandler: ShortcutHandler
    isEnabled: boolean
    combo: string
    display: string
    description?: string
    attemptCallbacks: Set<(matched: boolean, event: KeyboardEvent, details?: ShortcutAttemptDebugEvent) => void>
    parsedSteps: ParsedShortcut[]
    expectedSteps: string[]
    scopes: Set<string>
    progress: number
    lastMatchedAt: number
    debugHistory: string[]
    lastDebugAt: number
    except?: ExceptPreset | ExceptPreset[] | ExceptPredicate
    delay: number
    sequenceTimeout: number
    preventDefault: boolean
    stopPropagation: boolean
    stopOnMatch: boolean
    priority: number
}

export type ShortcutRegistry = {
    listeners: Map<string, RegistryEntry[]>
    firstStepIndex: Map<string, Set<string>>
    activeSequenceCombos: Set<string>
    options: UseShortcutOptions
    activeScopes: Set<string>
    nextId: number
    debugListeners: Set<(event: ShortcutDebugEvent) => void>
    listener: ((event: KeyboardEvent) => void) | null
    listenerTarget: (HTMLElement | Window) | null
    listenerEventType: "keydown" | "keyup"
}
