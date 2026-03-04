export const OS = {
    MAC: "mac",
    WINDOWS: "windows",
    LINUX: "linux",
} as const

export type PlatformType = (typeof OS)[keyof typeof OS]

// Backward-compatible alias used by public API and internal imports.
export const Platform = OS

export function detectPlatform(): PlatformType {
    if (typeof navigator === "undefined") return OS.WINDOWS

    const uaPlatform = (
        navigator as Navigator & {
            userAgentData?: { platform?: string }
        }
    ).userAgentData?.platform?.toLowerCase()

    const platform = (uaPlatform ?? navigator.platform).toLowerCase()

    if (
        platform.includes("mac")
        || platform.includes("iphone")
        || platform.includes("ipad")
        || platform.includes("ipod")
    ) {
        return OS.MAC
    }

    if (platform.includes("linux") || platform.includes("android")) {
        return OS.LINUX
    }

    if (platform.includes("win")) {
        return OS.WINDOWS
    }

    return OS.WINDOWS
}

export const ModifierKey = {
    META: "meta",
    CTRL: "ctrl",
    ALT: "alt",
    SHIFT: "shift",
} as const

export type ModifierKeyType = (typeof ModifierKey)[keyof typeof ModifierKey]

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

export const ModifierDisplayOrder: Record<PlatformType, ModifierKeyType[]> = {
    [OS.MAC]: [ModifierKey.CTRL, ModifierKey.ALT, ModifierKey.SHIFT, ModifierKey.META],
    [OS.WINDOWS]: [ModifierKey.META, ModifierKey.ALT, ModifierKey.SHIFT, ModifierKey.CTRL],
    [OS.LINUX]: [ModifierKey.META, ModifierKey.ALT, ModifierKey.SHIFT, ModifierKey.CTRL],
} as const
