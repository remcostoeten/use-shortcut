import type {
    ModifierFlags,
    ShortcutHandler,
    UseShortcutOptions,
    ExceptPreset,
    ExceptPredicate,
    ShortcutScope,
    ParsedShortcut,
} from "../types"

export type BuilderState = {
    modifiers: Partial<ModifierFlags>
    steps: string[]
    options: UseShortcutOptions
    except?: ExceptPreset | ExceptPreset[] | ExceptPredicate
    scopes?: ShortcutScope
}

export type RegistryEntry = {
    id: number
    userHandler: ShortcutHandler
    isEnabled: boolean
    attemptCallbacks: Set<(matched: boolean, event: KeyboardEvent) => void>
    parsedSteps: ParsedShortcut[]
    scopes: Set<string>
    progress: number
    lastMatchedAt: number
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
    listener: ((event: KeyboardEvent) => void) | null
    listenerTarget: (HTMLElement | Window) | null
    listenerEventType: "keydown" | "keyup"
}

