import type { KEY_NAMES, MODIFIERS } from "../vocabulary"

/** An opaque identifier. */
export type ID = string

/** Identifies one registered binding. Alternatives of one binding share it. */
export type BindingID = ID

/** A length of time in milliseconds: timeouts, waits, hold thresholds, hold durations. */
export type Milliseconds = number

/** A point in time from `performance.now()` or `KeyboardEvent.timeStamp`, in milliseconds. */
export type MonotonicTime = Milliseconds

/** A property that always exists but may hold no value. */
export type Nullable<Value> = Value | null

/** The raw `KeyboardEvent.key` value, such as `"?"`, `"ArrowUp"` or `"K"`. Not yet resolved. */
export type KeyValue = string

/** The raw `KeyboardEvent.code`, the physical key such as `"KeyK"`. Used when Alt changes the character. */
export type KeyCode = string

/** A key name the library accepts, such as `"k"`, `"escape"` or `"slash"`. A closed union. */
export type KeyName = (typeof KEY_NAMES)[number]

/** A modifier name as written in a chain: `ctrl`, `shift`, `lshift`, `rshift`, `alt`, `meta`, `mod`. */
export type Modifier = (typeof MODIFIERS)[number]

/** A named group of bindings that can be switched on and off at runtime. */
export type Scope = string

/** Ranks bindings that match the same keys. Only the highest priority fires. */
export type Priority = number

/** The written form of a binding, such as `"mod+k then s"`. */
export type Combo = string

/** Identifies a resolved step inside the trie. Two steps with the same signature share a node. */
export type StepSignature = string

/** Decides what `mod` means: Cmd on `"mac"`, Ctrl on `"other"`. */
export type Platform = "mac" | "other"

/** Who owns the keyboard: a browser on the `"web"`, or the app itself on the `"desktop"` (Tauri 2). */
export type Host = "web" | "desktop"

/** Whether a key event is a keydown or a keyup. */
export type KeyPhase = "down" | "up"

/** Which physical side a modifier key sits on, from `KeyboardEvent.location`. */
export type KeySide = "left" | "right"

/** The two events of a hold: `"start"` at the threshold and `"release"` on keyup. */
export type HoldPhase = "start" | "release"

/** Whether a step fires on a press or once a key has been held past its threshold. */
export type StepKind = "press" | "hold"
