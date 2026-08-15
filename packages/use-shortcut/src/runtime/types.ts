import type {
    ModifierFlags,
    ShortcutHandler,
    UseShortcutOptions,
    ExceptOption,
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
    except?: ExceptOption
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
    except?: ExceptOption
    delay: number
    sequenceTimeout: number
    preventDefault: boolean
    stopPropagation: boolean
    stopOnMatch: boolean
    priority: number
    timeoutIds: Set<ReturnType<typeof setTimeout>>
    renderSlot?: number
    lastSeenRenderCycle?: number
}

export type ShortcutRegistry = {
    listeners: Map<string, RegistryEntry[]>
    firstStepIndex: Map<string, Set<string>>
    activeSequenceCombos: Set<string>
    options: UseShortcutOptions
    activeScopes: Set<string>
    nextId: number
    debugListeners: Set<(event: ShortcutDebugEvent) => void>
    /**
     * Total attempt callbacks across all entries, maintained on add/remove so
     * the dispatcher can decide in O(1) whether attempt details are needed
     * instead of scanning every registered entry per keydown.
     */
    attemptCallbackCount: number
    listenerTarget: (HTMLElement | Window) | null
    listenerEventType: "keydown" | "keyup"
    pendingRecordings: Set<() => void>
    reconcileRenderBindings?: boolean
    collectingRenderBindings?: boolean
    renderCycle: number
    nextRenderSlot: number
    renderSlots: Map<number, RegistryEntry>
}
