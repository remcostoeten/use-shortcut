import { documentOf, elementOf } from "../shared/helpers/dom"
import type { Nullable } from "../shared/types/semantic"

/** A named skip rule: `"typing"` is the default, `"modal"` and `"disabled"` are opt-in. */
export type ExceptName = "typing" | "modal" | "disabled"

/** A custom skip rule. Returning true skips the binding for this event. */
export type ExceptPredicate = (target: Nullable<Element>) => boolean

/** One entry of a binding's `except` list. */
export type ExceptRule = ExceptName | ExceptPredicate

/** What `shouldSkip` needs from a binding. */
export type SkipOptions = { except: readonly ExceptRule[]; allowInInputs: boolean }

const NON_TEXT_INPUT_TYPES = new Set([
    "button",
    "checkbox",
    "radio",
    "submit",
    "reset",
    "file",
    "range",
    "color",
    "image",
    "hidden",
])

const MODAL_SELECTOR = 'dialog[open], [aria-modal="true"], [role="dialog"]'

function isVisibleModal(element: Element): boolean {
    return element.isConnected && element.closest("[hidden]") === null
}

function openModals(root: Document): Element[] {
    return Array.from(root.querySelectorAll(MODAL_SELECTOR)).filter(isVisibleModal)
}

function isDisabledElement(element: Element): boolean {
    return element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true"
}

function isDisabledTarget(target: Nullable<Element>): boolean {
    if (target === null) return false
    if (isDisabledElement(target)) return true
    return target.closest("fieldset[disabled]") !== null
}

function isBlockedByModal(target: Nullable<Element>): boolean {
    const modals = openModals(documentOf(target))
    if (modals.length === 0) return false
    if (target === null) return true
    return !modals.some((modal) => modal.contains(target))
}

function applyRule(rule: ExceptRule, target: Nullable<Element>): boolean {
    if (rule === "typing") return isTextTarget(target)
    if (rule === "modal") return isBlockedByModal(target)
    if (rule === "disabled") return isDisabledTarget(target)
    return rule(target)
}

/**
 * @name isTextTarget
 * @description Reports whether a key event target is somewhere the user types: a text-like
 * `<input>`, a `<textarea>`, a `<select>` or anything inside a contenteditable region.
 *
 * @example
 * if (isTextTarget(event.target)) return
 */
export function isTextTarget(target: Nullable<EventTarget>): boolean {
    if (target instanceof HTMLInputElement) return !NON_TEXT_INPUT_TYPES.has(target.type)
    if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true
    if (target instanceof HTMLElement) return target.isContentEditable
    return false
}

/**
 * @name isModalOpen
 * @description Reports whether the document has an open modal: a `<dialog>` with the `open`
 * attribute, an element with `aria-modal="true"` or an element with `role="dialog"`, as long
 * as it is connected and neither it nor an ancestor carries the `hidden` attribute.
 *
 * @example
 * if (isModalOpen(document)) pauseGlobalShortcuts()
 */
export function isModalOpen(root: Document): boolean {
    return openModals(root).length > 0
}

/**
 * @name shouldSkip
 * @description Decides whether a binding must ignore a key event based on its target. The
 * `"typing"` rule applies unless `allowInInputs` is set, then every rule in `except` is tried
 * in order. The first rule that matches skips the event.
 *
 * @example
 * if (shouldSkip(event.target, { except: ["modal"], allowInInputs: false })) return
 */
export function shouldSkip(target: Nullable<EventTarget>, options: SkipOptions): boolean {
    const element = elementOf(target)
    if (!options.allowInInputs && isTextTarget(element)) return true
    return options.except.some((rule) => applyRule(rule, element))
}
