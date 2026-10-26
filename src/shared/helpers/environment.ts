import type { Host, Platform } from "../types/semantic"

/**
 * @name detectPlatform
 * @description Reports whether the browser runs on a Mac, so `mod` can resolve to Cmd there and Ctrl
 * elsewhere. Reads `navigator` only when called, so importing this module during server rendering
 * never touches browser globals. Outside a browser it answers `"other"`.
 *
 * @example
 * const matcher = createMatcher(bindings, { platform: detectPlatform() })
 */
export function detectPlatform(): Platform {
    const description = typeof navigator === "undefined" ? "" : navigator.platform
    return /mac|iphone|ipad|ipod/i.test(description) ? "mac" : "other"
}

/**
 * @name detectHost
 * @description Reports whether the page runs inside a Tauri 2 window, where the app owns every key,
 * or in a browser, where combos like `mod+w` belong to the browser. Uses the `isTauri` flag Tauri 2
 * injects, the same check as `isTauri()` from `@tauri-apps/api`, without the dependency.
 *
 * @example
 * shortcuts.enable(detectHost())
 */
export function detectHost(): Host {
    const flag = Object.getOwnPropertyDescriptor(globalThis, "isTauri")
    return flag?.value === true ? "desktop" : "web"
}
