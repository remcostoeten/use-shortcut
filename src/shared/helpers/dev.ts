/**
 * @name isProduction
 * @description Reports whether the code runs in a production build. Bundlers replace
 * `process.env.NODE_ENV`, so the check folds away. Outside Node-like environments it answers false,
 * which keeps every check strict during development.
 *
 * @example
 * if (!isProduction()) console.warn("use-shortcut: two bindings share mod+k")
 */
export function isProduction(): boolean {
    return typeof process !== "undefined" && process.env.NODE_ENV === "production"
}

/**
 * @name throwInDev
 * @description Raises a mistake that typed code cannot make, such as an unknown key name from untyped
 * input. Throws during development so the mistake is found at once, and only warns in production so
 * a typo never takes the app down.
 *
 * @example
 * throwInDev(`use-shortcut: unknown key "${key}"`)
 */
export function throwInDev(message: string): void {
    if (isProduction()) {
        console.warn(message)
        return
    }
    throw new Error(message)
}

/**
 * @name warnInDev
 * @description Prints a development-only warning for a setup that works but is probably not intended,
 * such as two bindings on the same combo in one scope. Silent in production.
 *
 * @example
 * warnInDev("use-shortcut: two bindings in scope \"app\" share mod+k")
 */
export function warnInDev(message: string): void {
    if (isProduction()) return
    console.warn(message)
}
