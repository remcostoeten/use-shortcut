/** Supported runtime OS identifiers used by formatter and parser normalization. */
export const OS = {
    MAC: "mac",
    WINDOWS: "windows",
    LINUX: "linux",
} as const

export type PlatformType = (typeof OS)[keyof typeof OS]

/** Public platform constant alias (`Platform.MAC`, `Platform.WINDOWS`, `Platform.LINUX`). */
export const Platform = OS

let _cachedPlatform: PlatformType | null = null

/**
 * Detect the current OS platform for modifier normalization and display formatting.
 * Result is memoized for the page lifecycle.
 */
export function detectPlatform(): PlatformType {
    if (_cachedPlatform) return _cachedPlatform
    if (typeof navigator === "undefined") {
        _cachedPlatform = OS.WINDOWS
        return _cachedPlatform
    }

    const uaPlatform = (
        navigator as Navigator & {
            userAgentData?: { platform?: string }
        }
    ).userAgentData?.platform?.toLowerCase()

    const platform = (uaPlatform ?? navigator.platform ?? navigator.userAgent ?? "").toLowerCase()

    if (
        platform.includes("mac")
        || platform.includes("iphone")
        || platform.includes("ipad")
        || platform.includes("ipod")
    ) {
        _cachedPlatform = OS.MAC
        return _cachedPlatform
    }

    if (platform.includes("linux") || platform.includes("android")) {
        _cachedPlatform = OS.LINUX
        return _cachedPlatform
    }

    if (platform.includes("win")) {
        _cachedPlatform = OS.WINDOWS
        return _cachedPlatform
    }

    _cachedPlatform = OS.WINDOWS
    return _cachedPlatform
}

/** Canonical modifier token names used internally across parsing/formatting. */
export const ModifierKey = {
    META: "meta",
    CTRL: "ctrl",
    ALT: "alt",
    SHIFT: "shift",
} as const

export type ModifierKeyType = (typeof ModifierKey)[keyof typeof ModifierKey]

/** Alias map from user-facing modifier tokens to canonical modifier keys. */
export const ModifierAliases: Record<string, ModifierKeyType> = {
    command: ModifierKey.META,
    cmd: ModifierKey.META,
    "⌘": ModifierKey.META,
    meta: ModifierKey.META,
    win: ModifierKey.META,
    windows: ModifierKey.META,
    super: ModifierKey.META,
    mod: ModifierKey.META,
    control: ModifierKey.CTRL,
    ctrl: ModifierKey.CTRL,
    "⌃": ModifierKey.CTRL,
    ctl: ModifierKey.CTRL,
    alt: ModifierKey.ALT,
    option: ModifierKey.ALT,
    opt: ModifierKey.ALT,
    "⌥": ModifierKey.ALT,
    shift: ModifierKey.SHIFT,
    "⇧": ModifierKey.SHIFT,
    shft: ModifierKey.SHIFT,
} as const

/** Alias map from human shortcut key tokens to `KeyboardEvent.key`-compatible values. */
export const SpecialKeyMap: Record<string, string> = {
    up: "ArrowUp",
    down: "ArrowDown",
    left: "ArrowLeft",
    right: "ArrowRight",
    home: "Home",
    end: "End",
    pageup: "PageUp",
    pagedown: "PageDown",
    enter: "Enter",
    return: "Enter",
    space: " ",
    spacebar: " ",
    tab: "Tab",
    backspace: "Backspace",
    delete: "Delete",
    del: "Delete",
    escape: "Escape",
    esc: "Escape",
    f1: "F1",
    f2: "F2",
    f3: "F3",
    f4: "F4",
    f5: "F5",
    f6: "F6",
    f7: "F7",
    f8: "F8",
    f9: "F9",
    f10: "F10",
    f11: "F11",
    f12: "F12",
    plus: "+",
    minus: "-",
    comma: ",",
    period: ".",
    slash: "/",
    backslash: "\\",
    bracket: "[",
    closebracket: "]",
} as const

/** Platform-specific display labels/symbols for modifier keys. */
export const ModifierDisplaySymbols: Record<PlatformType, Record<ModifierKeyType, string>> = {
    [OS.MAC]: {
        [ModifierKey.META]: "⌘",
        [ModifierKey.CTRL]: "⌃",
        [ModifierKey.ALT]: "⌥",
        [ModifierKey.SHIFT]: "⇧",
    },
    [OS.WINDOWS]: {
        [ModifierKey.META]: "Ctrl",
        [ModifierKey.CTRL]: "Ctrl",
        [ModifierKey.ALT]: "Alt",
        [ModifierKey.SHIFT]: "Shift",
    },
    [OS.LINUX]: {
        [ModifierKey.META]: "Super",
        [ModifierKey.CTRL]: "Ctrl",
        [ModifierKey.ALT]: "Alt",
        [ModifierKey.SHIFT]: "Shift",
    },
} as const

/** Platform-specific canonical order for modifier rendering and combo normalization. */
export const ModifierDisplayOrder: Record<PlatformType, ModifierKeyType[]> = {
    [OS.MAC]: [ModifierKey.CTRL, ModifierKey.ALT, ModifierKey.SHIFT, ModifierKey.META],
    [OS.WINDOWS]: [ModifierKey.META, ModifierKey.ALT, ModifierKey.SHIFT, ModifierKey.CTRL],
    [OS.LINUX]: [ModifierKey.META, ModifierKey.ALT, ModifierKey.SHIFT, ModifierKey.CTRL],
} as const
