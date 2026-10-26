import type { ExceptRule } from "../browser/target"
import type { Handle, HoldEvent, PressEvent } from "../registry/registry"
import type {
    Combo,
    KeyName,
    Milliseconds,
    Modifier,
    Priority,
    StepKind,
} from "../shared/types/semantic"
import type { AvailableModifier, ModifierPrefix } from "./modifiers"

interface ModifierDocs {
    /**
     * @name ctrl
     * @description Requires the Control key. Excludes `ctrl` and `mod` from the rest of the step.
     *
     * @example
     * shortcut.ctrl.key("s").on(save)
     */
    readonly ctrl: true

    /**
     * @name shift
     * @description Requires Shift, either side. Excludes `shift`, `lshift` and `rshift` from the rest
     * of the step.
     *
     * @example
     * shortcut.shift.key("slash").on(toggleHelp)
     */
    readonly shift: true

    /**
     * @name lshift
     * @description Requires the left Shift key, read from `event.location`. Excludes `shift`, `lshift`
     * and `rshift` from the rest of the step.
     *
     * @example
     * shortcut.lshift.key("f").on(onlyLeft)
     */
    readonly lshift: true

    /**
     * @name rshift
     * @description Requires the right Shift key, read from `event.location`. Excludes `shift`, `lshift`
     * and `rshift` from the rest of the step.
     *
     * @example
     * shortcut.rshift.key("f").on(onlyRight)
     */
    readonly rshift: true

    /**
     * @name alt
     * @description Requires Alt, called Option on a Mac. Excludes `alt` from the rest of the step.
     *
     * @example
     * shortcut.alt.key("up").on(moveLineUp)
     */
    readonly alt: true

    /**
     * @name meta
     * @description Requires Cmd on a Mac and the Windows key elsewhere. Excludes `meta` and `mod` from
     * the rest of the step.
     *
     * @example
     * shortcut.meta.lshift.key("f").on(logState)
     */
    readonly meta: true

    /**
     * @name mod
     * @description Requires Cmd on a Mac and Ctrl elsewhere. Excludes `mod`, `ctrl` and `meta` from the
     * rest of the step.
     *
     * @example
     * shortcut.mod.key("k").on(openPalette)
     */
    readonly mod: true
}

/** The modifier getters still allowed in the current step, each keeping its hover docs. */
export type ModifierGetters<Scope extends string, Prefix extends string, Used extends Modifier> = {
    readonly [
        Name in keyof ModifierDocs as Name extends AvailableModifier<Used> ? Name : never
    ]: StepStage<Scope, Prefix, Used | Name>
}

export interface StepStarters<Scope extends string, Prefix extends string, Used extends Modifier> {
    /**
     * @name key
     * @description Adds a press step for one key. Key names are a closed union, so a typo fails to
     * compile.
     *
     * @example
     * shortcut.mod.key("k").on(openPalette)
     */
    key<Name extends KeyName>(
        name: Name,
    ): KeyStage<Scope, `${Prefix}${ModifierPrefix<Used>}${Name}`, "press">

    /**
     * @name hold
     * @description Adds a hold step. The handler receives `start` once the key has been held for the
     * threshold and `release` on keyup. Without a threshold the registry's default applies.
     *
     * @example
     * shortcut.hold("space", 300).on((event) => setPeeking(event.phase === "start"))
     */
    hold<Name extends KeyName>(
        name: Name,
        threshold?: Milliseconds,
    ): KeyStage<Scope, `${Prefix}hold ${ModifierPrefix<Used>}${Name}`, "hold">
}

/** Where a step is written: the modifiers still available plus `key` and `hold`. */
export type StepStage<
    Scope extends string,
    Prefix extends string,
    Used extends Modifier = never,
> = ModifierGetters<Scope, Prefix, Used> & StepStarters<Scope, Prefix, Used>

export interface WaitStep<Scope extends string, Prefix extends string> {
    /**
     * @name wait
     * @description Requires a pause before the next step: it must arrive at least `ms` after the
     * previous one and still inside the sequence timeout. Only a key or hold can follow.
     *
     * @example
     * shortcut.key("a").then.wait(300).key("b").on(archive)
     */
    wait<Ms extends Milliseconds>(ms: Ms): StepStage<Scope, `${Prefix}wait ${Ms}ms then `>
}

/** After `then`: a new step, optionally preceded by `wait`. */
export type ThenStage<Scope extends string, Prefix extends string> = StepStage<Scope, Prefix> &
    WaitStep<Scope, Prefix>

export interface Joiner<Scope extends string, Combo extends string> {
    /**
     * @name then
     * @description Starts the next step of a sequence. Each step is a combo of its own.
     *
     * @example
     * shortcut.key("g").then.key("d").on(goDashboard)
     */
    readonly then: ThenStage<Scope, `${Combo} then `>

    /**
     * @name or
     * @description Starts an alternative for the same handler. Each alternative is registered as its
     * own binding and the returned handle controls all of them; `combo` reads `"escape | mod+d"`.
     * Options set after the last alternative apply to every one of them.
     *
     * @example
     * shortcut.key("escape").or.mod.key("d").on(close)
     */
    readonly or: StepStage<Scope, `${Combo} | `>
}

/** After `key` or `hold`: continue with `then`, set options or register with `on`. */
export type KeyStage<Scope extends string, Combo extends string, Last extends StepKind> = Joiner<
    Scope,
    Combo
> &
    OptionsStage<Scope, Combo, Last>

/** The options a chain can set once each. */
export type OptionName = "in" | "except" | "allowInInputs" | "priority" | "describe"

interface OptionDocs<
    Scope extends string,
    Combo extends string,
    Last extends StepKind,
    Taken extends OptionName,
> {
    /**
     * @name in
     * @description Limits the binding to one or more scopes. It fires only while at least one of them
     * is enabled. Scope names come from `createChain` plus the built-in `web` and `desktop`, so a
     * typo fails to compile.
     *
     * @example
     * shortcut.mod.key("k").in("app").on(openPalette)
     */
    in(scope: Scope | readonly Scope[]): OptionsStage<Scope, Combo, Last, Taken | "in">

    /**
     * @name except
     * @description Skips the binding in one situation: `"typing"` (the default for text fields),
     * `"modal"` (a dialog is open), `"disabled"` (the focused element is disabled) or when a
     * predicate returns true for the event target.
     *
     * @example
     * shortcut.key("j").except("modal").on(next)
     */
    except(rule: ExceptRule): OptionsStage<Scope, Combo, Last, Taken | "except">

    /**
     * @name allowInInputs
     * @description Lets the binding fire while a text input, textarea, select or contenteditable
     * element has focus.
     *
     * @example
     * shortcut.mod.key("k").allowInInputs().on(openPalette)
     */
    allowInInputs(): OptionsStage<Scope, Combo, Last, Taken | "allowInInputs">

    /**
     * @name priority
     * @description Among bindings that match the same key event only the highest priority fires.
     * The default is 0.
     *
     * @example
     * shortcut.key("escape").in("modal").priority(10).on(closeModal)
     */
    priority(level: Priority): OptionsStage<Scope, Combo, Last, Taken | "priority">

    /**
     * @name describe
     * @description Text for help screens. Returned by `registry.list()` as `description`.
     *
     * @example
     * shortcut.mod.key("k").describe("Open the palette").on(openPalette)
     */
    describe(text: string): OptionsStage<Scope, Combo, Last, Taken | "describe">
}

/** The options not yet used on this chain, each keeping its hover docs. */
export type Options<
    Scope extends string,
    Combo extends string,
    Last extends StepKind,
    Taken extends OptionName,
> = {
    [
        Name in keyof OptionDocs<Scope, Combo, Last, Taken> as Name extends Taken ? never : Name
    ]: OptionDocs<Scope, Combo, Last, Taken>[Name]
}

/** What a handler receives, decided by the kind of the chain's last step. */
export type ChainEvent<Last extends StepKind> = Last extends "hold" ? HoldEvent : PressEvent

/** A handler for a chain whose last step is `Last`. */
export type ChainHandler<Last extends StepKind> = (event: ChainEvent<Last>) => void

/** The registry's handle with `combo` narrowed to the chain's literal text. */
export type ChainHandle<Text extends Combo> = Omit<Handle, "combo"> & { combo: Text }

export interface Registration<Combo extends string, Last extends StepKind> {
    /**
     * @name on
     * @description Registers the binding and returns its handle. A chain ending in `key` receives a
     * `PressEvent`, a chain ending in `hold` receives a `HoldEvent`. The handle's `combo` is typed
     * as the chain's literal text.
     *
     * @example
     * const handle = shortcut.mod.key("k").on(openPalette)
     * handle.combo // "mod+k"
     */
    on(handler: ChainHandler<Last>): ChainHandle<Combo>
}

/** After an option: the remaining options and `on`. */
export type OptionsStage<
    Scope extends string,
    Combo extends string,
    Last extends StepKind,
    Taken extends OptionName = never,
> = Options<Scope, Combo, Last, Taken> & Registration<Combo, Last>

/** The root of a chain, as returned by `createChain`. */
export type Shortcut<Scope extends string> = StepStage<Scope, "", never>
