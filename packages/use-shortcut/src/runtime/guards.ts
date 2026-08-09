import type { ExceptPreset, ExceptPredicate, ShortcutScope } from "../types"

export const _IGNORED_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"])

export const _EXCEPT_PREDICATES: Record<ExceptPreset, ExceptPredicate> = {
    input: e => {
        if (!(e.target instanceof HTMLElement)) return false
        const target = e.target
        return _IGNORED_TAGS.has(target.tagName)
    },
    editable: e => {
        if (!(e.target instanceof HTMLElement)) return false
        const target = e.target
        return target.isContentEditable
    },
    typing: e => {
        if (!(e.target instanceof HTMLElement)) return false
        const target = e.target
        return _IGNORED_TAGS.has(target.tagName) || target.isContentEditable
    },
    modal: () => {
        if (
            typeof document === "undefined" ||
            typeof document.querySelector !== "function"
        )
            return false
        return (
            document.querySelector('[data-modal="true"], [role="dialog"]') !==
            null
        )
    },
    disabled: e => {
        if (!(e.target instanceof HTMLElement)) return false
        const target = e.target
        return (
            target.hasAttribute("disabled") ||
            target.getAttribute("aria-disabled") === "true"
        )
    }
}

export function _shouldExcept(
    event: KeyboardEvent,
    except?: ExceptPreset | ExceptPreset[] | ExceptPredicate
): boolean {
    if (!except) return false

    if (typeof except === "function") {
        return except(event)
    }

    if (Array.isArray(except)) {
        return except.some(preset => _EXCEPT_PREDICATES[preset]?.(event))
    }

    return _EXCEPT_PREDICATES[except]?.(event) ?? false
}

export function _normalizeScopes(scopes?: ShortcutScope): string[] {
    if (!scopes) return []
    return (Array.isArray(scopes) ? scopes : [scopes])
        .map(scope => scope.trim())
        .filter(Boolean)
}

export function _scopeMatch(
    requiredScopes: Set<string>,
    activeScopes: Set<string>
): boolean {
    if (requiredScopes.size === 0) return true
    for (const required of requiredScopes) {
        if (activeScopes.has(required)) return true
    }
    return false
}

export function _isPureModifier(event: KeyboardEvent): boolean {
    const key = event.key.toLowerCase()
    // "super"/"hyper" (WebKitGTK) and "os" (legacy Firefox/IE) are
    // non-standard names for the Meta key; without them, recording
    // ends the moment Super is pressed instead of waiting for the
    // final non-modifier key.
    return (
        key === "shift" ||
        key === "control" ||
        key === "alt" ||
        key === "meta" ||
        key === "super" ||
        key === "hyper" ||
        key === "os"
    )
}
