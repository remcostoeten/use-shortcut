import type {
    ShortcutAttemptDebugEvent,
    ShortcutDebugEvent,
    ShortcutDebugInput,
    ShortcutDebugOptions,
    ShortcutDebugToken,
    ShortcutDebugTokenStatus,
    ShortcutAttemptStatus,
    UseShortcutOptions,
} from "../types"

function _isModifierToken(token: string): boolean {
    return token === "ctrl" || token === "alt" || token === "shift" || token === "cmd"
}

function _tokenizeCombo(combo: string): string[] {
    return combo.split("+").map((token) => token.trim()).filter(Boolean)
}

export function _getDebugOptions(debug: UseShortcutOptions["debug"]): ShortcutDebugOptions | undefined {
    if (!debug) return undefined
    if (debug === true) return { console: true }
    return debug
}

export function _shouldLogDebug(debug: UseShortcutOptions["debug"]): boolean {
    const options = _getDebugOptions(debug)
    if (!options) return false
    return options.console !== false
}

export function _debugLog(debug: UseShortcutOptions["debug"], ...args: unknown[]) {
    if (_shouldLogDebug(debug)) {
        console.log("[useShortcut]", ...args)
    }
}

export function _createDebugInput(event: KeyboardEvent, combo: string): ShortcutDebugInput {
    return {
        key: event.key,
        code: event.code,
        location: event.location,
        repeat: event.repeat,
        keyCode: "keyCode" in event ? event.keyCode : undefined,
        which: "which" in event ? event.which : undefined,
        combo,
        modifiers: {
            meta: event.metaKey,
            ctrl: event.ctrlKey,
            alt: event.altKey,
            shift: event.shiftKey,
        },
    }
}

function _createTokenStatus(
    token: string,
    expectedTokens: Set<string>,
    laterTokens: Set<string>,
): ShortcutDebugTokenStatus {
    if (expectedTokens.has(token)) return "match"
    if (laterTokens.has(token)) return "wrong-order"
    return "mismatch"
}

export function _buildAttemptSteps(expectedSteps: string[], actualSteps: string[], matched: boolean): ShortcutAttemptDebugEvent["steps"] {
    return expectedSteps.map((expected, index) => {
        const actual = actualSteps[index]
        if (!actual) {
            return {
                index,
                expected,
                status: "pending",
                tokens: [],
            }
        }

        const expectedTokens = new Set(_tokenizeCombo(expected))
        const laterTokens = new Set(expectedSteps.slice(index + 1).flatMap(_tokenizeCombo))
        const tokens: ShortcutDebugToken[] = _tokenizeCombo(actual).map((token, tokenIndex, allTokens) => ({
            token,
            kind: _isModifierToken(token) || tokenIndex < allTokens.length - 1 ? "modifier" : "key",
            status: _createTokenStatus(token, expectedTokens, laterTokens),
        }))

        if (actual === expected) {
            return {
                index,
                expected,
                actual,
                status: matched || index < actualSteps.length - 1 ? "match" : "partial",
                tokens,
            }
        }

        const status = expectedSteps.slice(index + 1).includes(actual) ? "wrong-order" : "mismatch"

        return {
            index,
            expected,
            actual,
            status,
            tokens,
        }
    })
}

export function _deriveAttemptStatus(
    steps: ShortcutAttemptDebugEvent["steps"],
    expectedLength: number,
    actualLength: number,
    matched: boolean,
): ShortcutAttemptStatus {
    if (matched) return "matched"

    const evaluatedSteps = steps.slice(0, actualLength)
    if (evaluatedSteps.length > 0 && evaluatedSteps.every((step) => step.status === "match" || step.status === "partial")) {
        return actualLength < expectedLength ? "partial" : "mismatch"
    }

    if (evaluatedSteps.some((step) => step.status === "wrong-order")) {
        return "wrong-order"
    }

    return "mismatch"
}

export function _logDebugEvent(debug: UseShortcutOptions["debug"], event: ShortcutDebugEvent) {
    if (!_shouldLogDebug(debug)) return

    const options = _getDebugOptions(debug)
    const metadata: string[] = []
    if (options?.includeCode && event.input.code) metadata.push(`code=${event.input.code}`)
    if (options?.includeLocation) metadata.push(`location=${String(event.input.location)}`)
    if (options?.includeKeyCode) {
        if (typeof event.input.keyCode === "number") metadata.push(`keyCode=${String(event.input.keyCode)}`)
        if (typeof event.input.which === "number") metadata.push(`which=${String(event.input.which)}`)
    }

    if (event.attempts.length === 0) {
        console.log("[useShortcut]", "key", event.input.combo, ...metadata)
        return
    }

    for (const attempt of event.attempts) {
        console.log(
            "[useShortcut]",
            attempt.status.toUpperCase(),
            `${event.input.combo} -> ${attempt.combo}`,
            ...metadata,
        )
    }
}
