import { resolveStep } from "./step"
import type { Step, StepInput } from "./step"
import type { BindingID, Milliseconds, Nullable, Platform } from "../shared/types/semantic"

/** A binding as the matcher receives it: an id and its steps in order. */
export type BindingInput = {
    id: BindingID
    steps: readonly StepInput[]
}

/** One node of the shared trie. `bindings` complete here, `children` continue a sequence. */
export type TrieNode = {
    step: Nullable<Step>
    bindings: readonly BindingID[]
    children: readonly TrieNode[]
}

type DraftNode = {
    step: Nullable<Step>
    bindings: BindingID[]
    children: Map<string, DraftNode>
}

function freeze(draft: DraftNode): TrieNode {
    return {
        step: draft.step,
        bindings: draft.bindings,
        children: [...draft.children.values()].map(freeze),
    }
}

/**
 * @name buildTrie
 * @description Merges the steps of every binding into one trie, so bindings that share a prefix share
 * nodes and one walk over the trie matches all of them at once.
 *
 * @example
 * const root = buildTrie([{ id: "save", steps: [{ kind: "press", key: "s", modifiers: ["mod"] }] }], "mac", 500)
 */
export function buildTrie(
    bindings: readonly BindingInput[],
    platform: Platform,
    holdThreshold: Milliseconds,
): TrieNode {
    const root: DraftNode = { step: null, bindings: [], children: new Map() }
    for (const binding of bindings) {
        if (binding.steps.length === 0)
            throw new Error(`use-shortcut: binding "${binding.id}" has no steps`)
        let node = root
        for (const input of binding.steps) {
            const step = resolveStep(input, platform, holdThreshold)
            const existing = node.children.get(step.signature)
            const next = existing ?? { step, bindings: [], children: new Map() }
            if (!existing) node.children.set(step.signature, next)
            node = next
        }
        node.bindings.push(binding.id)
    }
    return freeze(root)
}
