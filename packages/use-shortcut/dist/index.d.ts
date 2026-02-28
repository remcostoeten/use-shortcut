declare const Platform: {
    readonly MAC: "mac";
    readonly WINDOWS: "windows";
    readonly LINUX: "linux";
};
type PlatformType = (typeof Platform)[keyof typeof Platform];
declare function detectPlatform(): PlatformType;
declare const ModifierKey: {
    readonly META: "meta";
    readonly CTRL: "ctrl";
    readonly ALT: "alt";
    readonly SHIFT: "shift";
};
type ModifierKeyType = (typeof ModifierKey)[keyof typeof ModifierKey];
declare const ModifierAliases: Record<string, ModifierKeyType>;
declare const SpecialKeyMap: Record<string, string>;
declare const ModifierDisplaySymbols: Record<PlatformType, Record<ModifierKeyType, string>>;
declare const ModifierDisplayOrder: Record<PlatformType, ModifierKeyType[]>;

/** Lowercase letter keys a-z */
type AlphaKey = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z";
/** Number keys 0-9 */
type NumericKey = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
/** Function keys F1-F12 */
type FunctionKey = "f1" | "f2" | "f3" | "f4" | "f5" | "f6" | "f7" | "f8" | "f9" | "f10" | "f11" | "f12";
/** Arrow and navigation keys */
type NavigationKey = "up" | "down" | "left" | "right" | "arrowup" | "arrowdown" | "arrowleft" | "arrowright" | "home" | "end" | "pageup" | "pagedown";
/** Special action keys like Enter, Escape, Tab */
type SpecialKey = "enter" | "return" | "escape" | "esc" | "space" | "tab" | "backspace" | "delete" | "del" | "insert";
/** Symbol and punctuation keys */
type SymbolKey = "minus" | "plus" | "equal" | "equals" | "bracketleft" | "bracketright" | "backslash" | "slash" | "/" | "comma" | "period" | "semicolon" | "quote" | "backtick";
/**
 * All valid action keys that can be used with `.key()`
 * @example $.mod.key("s") // "s" is an ActionKey
 */
type ActionKey = AlphaKey | NumericKey | FunctionKey | NavigationKey | SpecialKey | SymbolKey;
/** Modifier key names used in the chainable API */
type ModifierName = "ctrl" | "shift" | "alt" | "cmd" | "mod";
/** Internal modifier state flags */
type ModifierFlags = {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    cmd: boolean;
};
/** Modifier key state from a keyboard event */
type ModifierState = {
    meta: boolean;
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
};
/** Result of parsing a shortcut string */
type ParsedShortcut = {
    modifiers: ModifierState;
    key: string;
    original: string;
};
type EmptyModifiers = {};
/**
 * Handler function called when a shortcut is triggered
 * @param event - The keyboard event that triggered the shortcut
 */
type ShortcutHandler = (event: KeyboardEvent) => void;
/**
 * Custom predicate for excluding shortcuts in certain conditions
 * @param event - The keyboard event to evaluate
 * @returns `true` to skip the shortcut, `false` to allow it
 */
type ExceptPredicate = (event: KeyboardEvent) => boolean;
/**
 * Built-in exception presets for common scenarios
 * - "input" - Skip when focused on input, textarea, or select
 * - "editable" - Skip when focused on contentEditable elements
 * - "typing" - Skip in any text input context (combines input + editable)
 * - "modal" - Skip when a modal/dialog is open (checks [data-modal] or [role="dialog"])
 * - "disabled" - Skip when focused element is disabled
 */
type ExceptPreset = "input" | "editable" | "typing" | "modal" | "disabled";
type ShortcutScope = string | string[];
type ShortcutConflict = {
    combo: string;
    existingCombo: string;
    reason: "exact" | "sequence-prefix";
};
/**
 * Options for shortcut handler registration
 */
type HandlerOptions = {
    /** Prevent the browser's default action (default: `true`) */
    preventDefault?: boolean;
    /** Stop event propagation */
    stopPropagation?: boolean;
    /** Delay handler execution in milliseconds */
    delay?: number;
    /** Description for documentation/debugging */
    description?: string;
    /** Disable this specific shortcut */
    disabled?: boolean;
    /** Limit shortcut to a specific DOM element */
    scope?: HTMLElement | null;
    /** Conditions to skip the shortcut */
    except?: ExceptPreset | ExceptPreset[] | ExceptPredicate;
    /** Required named scopes that must be active */
    scopes?: ShortcutScope;
    /** Timeout in ms for multi-step sequences */
    sequenceTimeout?: number;
    /** Higher priority handlers run first (default: 0) */
    priority?: number;
    /** Stop evaluating other handlers for this combo when matched */
    stopOnMatch?: boolean;
};
/**
 * Result object returned when registering a shortcut
 * Provides control over the shortcut and display information
 */
type ShortcutResult = {
    /** Remove the keyboard listener */
    unbind: () => void;
    /** Platform-aware display string (e.g., "⌘S" on Mac, "Ctrl+S" on Windows) */
    display: string;
    /** Normalized combo string (e.g., "cmd+s" or "g d") */
    combo: string;
    /** Programmatically trigger the shortcut handler */
    trigger: () => void;
    /** Whether the shortcut is currently enabled */
    isEnabled: boolean;
    /** Enable the shortcut (after being disabled) */
    enable: () => void;
    /** Temporarily disable the shortcut */
    disable: () => void;
    /** Subscribe to shortcut attempt events (useful for visual feedback) */
    onAttempt?: (callback: (matched: boolean, event: KeyboardEvent) => void) => () => void;
};
/**
 * Chainable modifier builder with type-safe exhaustion
 * Each modifier can only be used once in a chain
 */
type ModifierChain<Used extends Partial<ModifierFlags>> = {
    ctrl: Used["ctrl"] extends true ? never : ModifierChain<Used & {
        ctrl: true;
    }>;
    shift: Used["shift"] extends true ? never : ModifierChain<Used & {
        shift: true;
    }>;
    alt: Used["alt"] extends true ? never : ModifierChain<Used & {
        alt: true;
    }>;
    cmd: Used["cmd"] extends true ? never : ModifierChain<Used & {
        cmd: true;
    }>;
    mod: Used["cmd"] extends true ? never : ModifierChain<Used & {
        cmd: true;
    }>;
    key: <K extends ActionKey>(key: K) => KeyChain<Used, K>;
    in: (scopes: ShortcutScope) => ModifierChain<Used>;
};
/**
 * Chain state after calling `.key()` - ready to attach a handler
 */
type KeyChain<Used extends Partial<ModifierFlags>, Key extends string> = {
    /** Attach a handler to this shortcut */
    on: (handler: ShortcutHandler, options?: HandlerOptions) => ShortcutResult;
    /** Attach a handler with inline options */
    handle: (options: HandlerOptions & {
        handler: ShortcutHandler;
    }) => ShortcutResult;
    /** Add exception conditions before attaching handler */
    except: (condition: ExceptPreset | ExceptPreset[] | ExceptPredicate) => KeyChainWithExcept<Used, Key>;
    /** Add required named scopes */
    in: (scopes: ShortcutScope) => KeyChain<Used, Key>;
    /** Add the next step in a sequence */
    then: <K extends ActionKey | string>(key: K) => KeyChain<Used, `${Key} ${K}`>;
};
/**
 * Chain state after calling `.except()` - ready to attach handler
 */
type KeyChainWithExcept<Used extends Partial<ModifierFlags>, Key extends string> = {
    on: (handler: ShortcutHandler, options?: Omit<HandlerOptions, "except">) => ShortcutResult;
    in: (scopes: ShortcutScope) => KeyChainWithExcept<Used, Key>;
    then: <K extends ActionKey | string>(key: K) => KeyChainWithExcept<Used, `${Key} ${K}`>;
};
type ShortcutRecordingOptions = {
    target?: HTMLElement | Window | null;
    eventType?: "keydown" | "keyup";
    timeoutMs?: number;
};
/**
 * The main shortcut builder interface returned by `useShortcut()`
 */
type ShortcutBuilder = ModifierChain<EmptyModifiers> & {
    ctrl: ModifierChain<{
        ctrl: true;
    }>;
    shift: ModifierChain<{
        shift: true;
    }>;
    alt: ModifierChain<{
        alt: true;
    }>;
    cmd: ModifierChain<{
        cmd: true;
    }>;
    mod: ModifierChain<{
        cmd: true;
    }>;
    key: <K extends ActionKey>(key: K) => KeyChain<EmptyModifiers, K>;
    /** Set required scopes for upcoming chain calls */
    in: (scopes: ShortcutScope) => ShortcutBuilder;
    /** Update active scopes at runtime */
    setScopes: (scopes: ShortcutScope) => void;
    /** Enable one scope */
    enableScope: (scope: string) => void;
    /** Disable one scope */
    disableScope: (scope: string) => void;
    /** Return currently active scopes */
    getScopes: () => string[];
    /** Check if a scope is active */
    isScopeActive: (scope: string) => boolean;
    /** Record the next key combo */
    record: (options?: ShortcutRecordingOptions) => Promise<string>;
};
/**
 * Options for the `useShortcut` hook
 */
type UseShortcutOptions = {
    /** Enable debug logging to console */
    debug?: boolean;
    /** Global delay for all handlers in milliseconds */
    delay?: number;
    /** Skip shortcuts when focused on input elements (default: `true`) */
    ignoreInputs?: boolean;
    /** Target element for keyboard listeners (default: `window`) */
    target?: HTMLElement | Window | null;
    /** Keyboard event type to listen for (default: "keydown") */
    eventType?: "keydown" | "keyup";
    /** Globally disable all shortcuts from this hook */
    disabled?: boolean;
    /** Active named scopes. Shortcuts with scopes only run when at least one matches. */
    activeScopes?: ShortcutScope;
    /** Global timeout in ms for sequence completion */
    sequenceTimeout?: number;
    /** Warn when conflicting shortcuts are registered (default: true) */
    conflictWarnings?: boolean;
    /** Custom conflict callback */
    onConflict?: (conflict: ShortcutConflict) => void;
    /** Global event filter; return false to skip all shortcuts for the event */
    eventFilter?: (event: KeyboardEvent) => boolean;
};
type ShortcutMapEntry = {
    keys: string | string[];
    handler: ShortcutHandler;
    options?: HandlerOptions;
};
type ShortcutMap = Record<string, ShortcutMapEntry>;
type ShortcutMapResult<T extends ShortcutMap = ShortcutMap> = {
    [K in keyof T]: ShortcutResult;
};
type ShortcutGroup = {
    add: (...results: ShortcutResult[]) => void;
    addMany: (results: ShortcutResult[] | Record<string, ShortcutResult>) => void;
    unbindAll: () => void;
    clear: () => void;
    getResults: () => ShortcutResult[];
};

/**
 * Parse a shortcut string into its components
 *
 * @param shortcut - Shortcut string (e.g., "cmd+s", "ctrl+shift+p")
 * @returns Parsed shortcut with modifiers, key, and original string
 *
 * @example
 * ```ts
 * const parsed = parseShortcut("cmd+s")
 * // { modifiers: { meta: true, ... }, key: "s", original: "cmd+s" }
 * ```
 */
declare function parseShortcut(shortcut: string): ParsedShortcut;
/**
 * Parse multiple shortcut strings
 *
 * @param shortcuts - Single shortcut or array of shortcuts
 * @returns Array of parsed shortcuts
 */
declare function parseShortcuts(shortcuts: string | string[]): ParsedShortcut[];
/**
 * Extract modifier state from a keyboard event
 *
 * @param event - The keyboard event
 * @returns Object with meta, ctrl, alt, shift boolean flags
 */
declare function getModifiersFromEvent(event: KeyboardEvent): ModifierState;
/**
 * Check if a keyboard event matches a parsed shortcut
 *
 * @param event - The keyboard event to check
 * @param parsed - The parsed shortcut to match against
 * @returns `true` if the event matches the shortcut
 */
declare function matchesShortcut(event: KeyboardEvent, parsed: ParsedShortcut): boolean;
/**
 * Check if a keyboard event matches any of the parsed shortcuts
 *
 * @param event - The keyboard event to check
 * @param parsedShortcuts - Array of parsed shortcuts to match against
 * @returns `true` if the event matches any shortcut
 */
declare function matchesAnyShortcut(event: KeyboardEvent, parsedShortcuts: ParsedShortcut[]): boolean;

/**
 * Format a shortcut string for display with platform-aware symbols
 *
 * @param shortcut - Shortcut string (e.g., "cmd+s")
 * @param platform - Optional platform override (default: auto-detect)
 * @returns Formatted display string (e.g., "⌘S" on Mac, "Ctrl+S" on Windows)
 *
 * @example
 * ```ts
 * formatShortcut("cmd+s") // "⌘S" on Mac, "Ctrl+S" on Windows
 * formatShortcut("ctrl+shift+p", "mac") // "⌃⇧P"
 * ```
 */
declare function formatShortcut(shortcut: string, platform?: PlatformType): string;
/**
 * Get the modifier key symbols for a platform
 *
 * @param platform - Optional platform override (default: auto-detect)
 * @returns Object mapping modifier keys to display symbols
 *
 * @example
 * ```ts
 * getModifierSymbols("mac") // { meta: "⌘", ctrl: "⌃", alt: "⌥", shift: "⇧" }
 * ```
 */
declare function getModifierSymbols(platform?: PlatformType): Record<ModifierKeyType, string>;

declare function registerShortcutMap<T extends ShortcutMap>(builder: ShortcutBuilder, shortcutMap: T): ShortcutMapResult<T>;
/**
 * React hook for registering chainable keyboard shortcuts
 *
 * @param options - Configuration options for the hook
 * @returns A chainable shortcut builder (`$`)
 */
declare function useShortcut(options?: UseShortcutOptions): ShortcutBuilder;
/**
 * Bulk registration helper for shortcut maps.
 */
declare function useShortcutMap<T extends ShortcutMap>(shortcutMap: T, options?: UseShortcutOptions): ShortcutMapResult<T>;
/**
 * Create a shortcut builder for non-React usage
 *
 * Unlike `useShortcut`, this does not auto-cleanup - you must call `.unbind()` manually.
 *
 * @param options - Configuration options
 * @returns A chainable shortcut builder
 */
declare function createShortcut(options?: UseShortcutOptions): ShortcutBuilder;
/**
 * Bulk registration helper for non-React usage.
 */
declare function createShortcutMap<T extends ShortcutMap>(shortcutMap: T, options?: UseShortcutOptions): ShortcutMapResult<T>;
declare function createShortcutGroup(): ShortcutGroup;
declare function useShortcutGroup(): ShortcutGroup;

export { type ActionKey, type AlphaKey, type ExceptPredicate, type ExceptPreset, type FunctionKey, type HandlerOptions, type KeyChain, ModifierAliases, type ModifierChain, ModifierDisplayOrder, ModifierDisplaySymbols, type ModifierFlags, ModifierKey, type ModifierName, type ModifierState, type NavigationKey, type NumericKey, type ParsedShortcut, Platform, type ShortcutBuilder, type ShortcutConflict, type ShortcutGroup, type ShortcutHandler, type ShortcutMap, type ShortcutMapEntry, type ShortcutMapResult, type ShortcutRecordingOptions, type ShortcutResult, type ShortcutScope, type SpecialKey, SpecialKeyMap, type SymbolKey, type UseShortcutOptions, createShortcut, createShortcutGroup, createShortcutMap, detectPlatform, formatShortcut, getModifierSymbols, getModifiersFromEvent, matchesAnyShortcut, matchesShortcut, parseShortcut, parseShortcuts, registerShortcutMap, useShortcut, useShortcutGroup, useShortcutMap };
