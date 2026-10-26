import type { Nullable } from "../types/semantic"

/**
 * @name elementOf
 * @description Narrows an event target to an element. Text nodes, the document and the window give
 * null, so callers deal with one shape.
 *
 * @example
 * const element = elementOf(event.target)
 */
export function elementOf(target: Nullable<EventTarget>): Nullable<Element> {
    return target instanceof Element ? target : null
}

/**
 * @name documentOf
 * @description Finds the document an event target belongs to, which differs from the global one
 * inside an iframe. Falls back to the global document for targets without one.
 *
 * @example
 * const open = documentOf(event.target).querySelector("dialog[open]")
 */
export function documentOf(target: Nullable<EventTarget>): Document {
    if (target instanceof Document) return target
    if (target instanceof Node && target.ownerDocument !== null) return target.ownerDocument
    return document
}
