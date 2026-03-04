/** Lowercase letter keys a-z */
export type AlphaKey =
    | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m"
    | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z"

/** Number keys 0-9 */
export type NumericKey = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

/** Function keys F1-F12 */
export type FunctionKey = "f1" | "f2" | "f3" | "f4" | "f5" | "f6" | "f7" | "f8" | "f9" | "f10" | "f11" | "f12"

/** Arrow and navigation keys */
export type NavigationKey =
    | "up" | "down" | "left" | "right"
    | "arrowup" | "arrowdown" | "arrowleft" | "arrowright"
    | "home" | "end" | "pageup" | "pagedown"

/** Special action keys like Enter, Escape, Tab */
export type SpecialKey =
    | "enter" | "return" | "escape" | "esc" | "space"
    | "tab" | "backspace" | "delete" | "del" | "insert"

/** Symbol and punctuation keys */
export type SymbolKey =
    | "minus" | "plus" | "equal" | "equals"
    | "bracketleft" | "bracketright" | "backslash" | "slash" | "/"
    | "comma" | "period" | "semicolon" | "quote" | "backtick"

/**
 * All valid action keys that can be used with `.key()`
 * @example $.mod.key("s") // "s" is an ActionKey
 */
export type ActionKey = AlphaKey | NumericKey | FunctionKey | NavigationKey | SpecialKey | SymbolKey

/** Modifier key names used in the chainable API */
export type ModifierName = "ctrl" | "shift" | "alt" | "cmd" | "mod"

/** Internal modifier state flags */
export type ModifierFlags = {
    ctrl: boolean
    shift: boolean
    alt: boolean
    cmd: boolean
}

/** Modifier key state from a keyboard event */
export type ModifierState = {
    meta: boolean
    ctrl: boolean
    alt: boolean
    shift: boolean
}

/** Result of parsing a shortcut string */
export type ParsedShortcut = {
    modifiers: ModifierState
    key: string
    original: string
}

export type EmptyModifiers = {}

/**
 * Handler function called when a shortcut is triggered
 * @param event - The keyboard event that triggered the shortcut
 */
export type ShortcutHandler = (event: KeyboardEvent) => void

/**
 * Custom predicate for excluding shortcuts in certain conditions
 * @param event - The keyboard event to evaluate
 * @returns `true` to skip the shortcut, `false` to allow it
 */
export type ExceptPredicate = (event: KeyboardEvent) => boolean

/**
 * Built-in exception presets for common scenarios
 * - "input" - Skip when focused on input, textarea, or select
 * - "editable" - Skip when focused on contentEditable elements
 * - "typing" - Skip in any text input context (combines input + editable)
 * - "modal" - Skip when a modal/dialog is open (checks [data-modal] or [role="dialog"])
 * - "disabled" - Skip when focused element is disabled
 */
export type ExceptPreset = "input" | "editable" | "typing" | "modal" | "disabled"

export type ShortcutScope = string | string[]

export type ShortcutConflict = {
    combo: string
    existingCombo: string
    reason: "exact" | "sequence-prefix"
}

/**
 * Options for shortcut handler registration
 */
export type HandlerOptions = {
    /** Prevent the browser's default action (default: `true`) */
    preventDefault?: boolean
    /** Stop event propagation */
    stopPropagation?: boolean
    /** Delay handler execution in milliseconds */
    delay?: number
    /** Description for documentation/debugging */
    description?: string
    /** Disable this specific shortcut */
    disabled?: boolean
    /** Conditions to skip the shortcut */
    except?: ExceptPreset | ExceptPreset[] | ExceptPredicate
    /** Required named scopes that must be active */
    scopes?: ShortcutScope
    /** Timeout in ms for multi-step sequences */
    sequenceTimeout?: number
    /** Higher priority handlers run first (default: 0) */
    priority?: number
    /** Stop evaluating other handlers for this combo when matched */
    stopOnMatch?: boolean
}

/**
 * Result object returned when registering a shortcut
 * Provides control over the shortcut and display information
 */
export type ShortcutResult = {
    /** Remove the keyboard listener */
    unbind: () => void
    /** Platform-aware display string (e.g., "⌘S" on Mac, "Ctrl+S" on Windows) */
    display: string
    /** Normalized combo string (e.g., "cmd+s" or "g d") */
    combo: string
    /** Programmatically trigger the shortcut handler */
    trigger: () => void
    /** Whether the shortcut is currently enabled */
    isEnabled: boolean
    /** Enable the shortcut (after being disabled) */
    enable: () => void
    /** Temporarily disable the shortcut */
    disable: () => void
    /** Subscribe to shortcut attempt events (useful for visual feedback) */
    onAttempt?: (callback: (matched: boolean, event: KeyboardEvent) => void) => () => void
}

export type RemainingModifiers<Used extends Partial<ModifierFlags>> = Exclude<
    ModifierName,
    | (Used extends { ctrl: true } ? "ctrl" : never)
    | (Used extends { shift: true } ? "shift" : never)
    | (Used extends { alt: true } ? "alt" : never)
    | (Used extends { cmd: true } ? "cmd" | "mod" : never)
>

/**
 * Chainable modifier builder with type-safe exhaustion
 * Each modifier can only be used once in a chain
 */
export type ModifierChain<Used extends Partial<ModifierFlags>> = {
    ctrl: Used["ctrl"] extends true ? never : ModifierChain<Used & { ctrl: true }>
    shift: Used["shift"] extends true ? never : ModifierChain<Used & { shift: true }>
    alt: Used["alt"] extends true ? never : ModifierChain<Used & { alt: true }>
    cmd: Used["cmd"] extends true ? never : ModifierChain<Used & { cmd: true }>
    mod: Used["cmd"] extends true ? never : ModifierChain<Used & { cmd: true }>
    key: <K extends ActionKey>(key: K) => KeyChain<Used, K>
    in: (scopes: ShortcutScope) => ModifierChain<Used>
}

/**
 * Chain state after calling `.key()` - ready to attach a handler
 */
export type KeyChain<Used extends Partial<ModifierFlags>, Key extends string> = {
    /** Attach a handler to this shortcut */
    on: (handler: ShortcutHandler, options?: HandlerOptions) => ShortcutResult
    /** Attach a handler with inline options */
    handle: (options: HandlerOptions & { handler: ShortcutHandler }) => ShortcutResult
    /** Add exception conditions before attaching handler */
    except: (condition: ExceptPreset | ExceptPreset[] | ExceptPredicate) => KeyChainWithExcept<Used, Key>
    /** Add required named scopes */
    in: (scopes: ShortcutScope) => KeyChain<Used, Key>
    /** Add the next step in a sequence */
    then: <K extends ActionKey | string>(key: K) => KeyChain<Used, `${Key} ${K}`>
}

/**
 * Chain state after calling `.except()` - ready to attach handler
 */
export type KeyChainWithExcept<Used extends Partial<ModifierFlags>, Key extends string> = {
    on: (handler: ShortcutHandler, options?: Omit<HandlerOptions, "except">) => ShortcutResult
    in: (scopes: ShortcutScope) => KeyChainWithExcept<Used, Key>
    then: <K extends ActionKey | string>(key: K) => KeyChainWithExcept<Used, `${Key} ${K}`>
}

export type ShortcutRecordingOptions = {
    target?: HTMLElement | Window | null
    eventType?: "keydown" | "keyup"
    timeoutMs?: number
}

/**
 * The main shortcut builder interface returned by `useShortcut()`
 */
export type ShortcutBuilder = ModifierChain<EmptyModifiers> & {
    ctrl: ModifierChain<{ ctrl: true }>
    shift: ModifierChain<{ shift: true }>
    alt: ModifierChain<{ alt: true }>
    cmd: ModifierChain<{ cmd: true }>
    mod: ModifierChain<{ cmd: true }>
    key: <K extends ActionKey>(key: K) => KeyChain<EmptyModifiers, K>
    /** Set required scopes for upcoming chain calls */
    in: (scopes: ShortcutScope) => ShortcutBuilder
    /** Update active scopes at runtime */
    setScopes: (scopes: ShortcutScope) => void
    /** Enable one scope */
    enableScope: (scope: string) => void
    /** Disable one scope */
    disableScope: (scope: string) => void
    /** Return currently active scopes */
    getScopes: () => string[]
    /** Check if a scope is active */
    isScopeActive: (scope: string) => boolean
    /** Record the next key combo */
    record: (options?: ShortcutRecordingOptions) => Promise<string>
}

/**
 * Options for the `useShortcut` hook
 */
export type UseShortcutOptions = {
    /** Enable debug logging to console */
    debug?: boolean
    /** Global delay for all handlers in milliseconds */
    delay?: number
    /** Skip shortcuts when focused on input elements (default: `true`) */
    ignoreInputs?: boolean
    /** Target element for keyboard listeners (default: `window`) */
    target?: HTMLElement | Window | null
    /** Keyboard event type to listen for (default: "keydown") */
    eventType?: "keydown" | "keyup"
    /** Globally disable all shortcuts from this hook */
    disabled?: boolean
    /** Active named scopes. Shortcuts with scopes only run when at least one matches. */
    activeScopes?: ShortcutScope
    /** Global timeout in ms for sequence completion */
    sequenceTimeout?: number
    /** Warn when conflicting shortcuts are registered (default: true) */
    conflictWarnings?: boolean
    /** Custom conflict callback */
    onConflict?: (conflict: ShortcutConflict) => void
    /** Global event filter; return false to skip all shortcuts for the event */
    eventFilter?: (event: KeyboardEvent) => boolean
}

export type ShortcutMapEntry = {
    keys: string | string[]
    handler: ShortcutHandler
    options?: HandlerOptions
}

export type ShortcutMap = Record<string, ShortcutMapEntry>

export type ShortcutMapResult<T extends ShortcutMap = ShortcutMap> = {
    [K in keyof T]: ShortcutResult
}

export type ShortcutGroup = {
    add: (...results: ShortcutResult[]) => void
    addMany: (results: ShortcutResult[] | Record<string, ShortcutResult>) => void
    unbindAll: () => void
    clear: () => void
    getResults: () => ShortcutResult[]
}
