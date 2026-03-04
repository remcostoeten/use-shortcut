export function _debugLog(debug: boolean | undefined, ...args: unknown[]) {
    if (debug) {
        console.log("[useShortcut]", ...args)
    }
}

