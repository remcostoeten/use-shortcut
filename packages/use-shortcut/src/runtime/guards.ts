import type { ExceptOption, ExceptPreset, ExceptPredicate, ShortcutScope } from "../types"

export const _IGNORED_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"])

const _MODAL_SELECTOR_TOP_LAYER = '[data-modal="true"], [role="dialog"], dialog:modal'

// `:modal` only matches dialogs actually promoted to the top layer by
// `showModal()`, which is what should swallow a shortcut. It is unsupported in
// older engines and in jsdom, where `querySelector` throws on the whole
// selector list, so fall back to the attribute form there — that one also
// matches a non-modal `dialog.show()`, which is the lesser evil.
const _MODAL_SELECTOR_ATTRIBUTE = '[data-modal="true"], [role="dialog"], dialog[open]'

let _modalSelector: string | null = null

export function _resolveModalSelector(): string {
    if (_modalSelector !== null) return _modalSelector

    try {
        document.querySelector(_MODAL_SELECTOR_TOP_LAYER)
        _modalSelector = _MODAL_SELECTOR_TOP_LAYER
    } catch {
        _modalSelector = _MODAL_SELECTOR_ATTRIBUTE
    }

    return _modalSelector
}

/** Test seam: drops the memoized `:modal` support probe. */
export function _resetModalSelectorCache(): void {
    _modalSelector = null
}

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
        return document.querySelector(_resolveModalSelector()) !== null
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

function _resolveExcept(
    entry: ExceptPreset | ExceptPredicate
): ExceptPredicate | undefined {
    return typeof entry === "function" ? entry : _EXCEPT_PREDICATES[entry]
}

export function _shouldExcept(event: KeyboardEvent, except?: ExceptOption): boolean {
    if (!except) return false

    if (typeof except === "function") {
        return except(event)
    }

    if (Array.isArray(except)) {
        return except.some(entry => _resolveExcept(entry)?.(event) ?? false)
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
