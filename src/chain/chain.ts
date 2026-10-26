import type { ExceptRule } from "../browser/target"
import type { StepInput } from "../core/step"
import type { BindingDefinition, Handle, Handler, ShortcutEvent } from "../registry/registry"
import type {
    Combo,
    Host,
    KeyName,
    Milliseconds,
    Modifier,
    Priority,
    Scope,
} from "../shared/types/semantic"
import type { ChainHandle, Shortcut } from "./stages"

/** Registers a finished chain. The default is `registry.add`; React passes one that binds in an effect. */
export type Bind = (definition: BindingDefinition, handler: Handler) => Handle

type Pending = {
    modifiers: readonly Modifier[]
    minDelay?: Milliseconds
}

type Options = Omit<BindingDefinition, "steps">

type State = {
    alternatives: readonly (readonly StepInput[])[]
    steps: readonly StepInput[]
    pending: Pending
    options: Options
}

type Runtime = {
    readonly ctrl: Runtime
    readonly shift: Runtime
    readonly lshift: Runtime
    readonly rshift: Runtime
    readonly alt: Runtime
    readonly meta: Runtime
    readonly mod: Runtime
    readonly then: Runtime
    readonly or: Runtime
    key: (name: KeyName) => Runtime
    hold: (name: KeyName, threshold?: Milliseconds) => Runtime
    wait: (ms: Milliseconds) => Runtime
    in: (scope: Scope | readonly Scope[]) => Runtime
    except: (rule: ExceptRule) => Runtime
    allowInInputs: () => Runtime
    priority: (level: Priority) => Runtime
    describe: (text: string) => Runtime
    on: <Text extends Combo, Event extends ShortcutEvent>(
        handler: (event: Event) => void,
    ) => ChainHandle<Text>
}

const EMPTY_PENDING: Pending = { modifiers: [] }

function combine(first: Handle, rest: readonly Handle[]): Handle {
    const all = [first, ...rest]
    return {
        id: first.id,
        combo: all.map((handle) => handle.combo).join(" | "),
        display: all.map((handle) => handle.display).join(" / "),
        isEnabled: () => first.isEnabled(),
        enable: () => all.forEach((handle) => handle.enable()),
        disable: () => all.forEach((handle) => handle.disable()),
        unbind: () => all.forEach((handle) => handle.unbind()),
        trigger: () => first.trigger(),
    }
}

function register<Text extends Combo, Event extends ShortcutEvent>(
    bind: Bind,
    state: State,
    handler: (event: Event) => void,
): ChainHandle<Text>
function register(bind: Bind, state: State, handler: Handler): Handle {
    const [first, ...rest] = [...state.alternatives, state.steps].map((steps) =>
        bind({ steps, ...state.options }, handler),
    )
    if (!first) throw new Error("use-shortcut: a chain needs at least one step before on()")
    return rest.length === 0 ? first : combine(first, rest)
}

function stage(state: State, bind: Bind): Runtime {
    function withModifier(modifier: Modifier): Runtime {
        const pending: Pending = {
            ...state.pending,
            modifiers: [...state.pending.modifiers, modifier],
        }
        return stage({ ...state, pending }, bind)
    }

    function withStep(step: StepInput): Runtime {
        return stage({ ...state, steps: [...state.steps, step], pending: EMPTY_PENDING }, bind)
    }

    function withOptions(options: Options): Runtime {
        return stage({ ...state, options: { ...state.options, ...options } }, bind)
    }

    return {
        get ctrl() {
            return withModifier("ctrl")
        },
        get shift() {
            return withModifier("shift")
        },
        get lshift() {
            return withModifier("lshift")
        },
        get rshift() {
            return withModifier("rshift")
        },
        get alt() {
            return withModifier("alt")
        },
        get meta() {
            return withModifier("meta")
        },
        get mod() {
            return withModifier("mod")
        },
        // oxlint-disable-next-line unicorn/no-thenable -- `then` returns a stage, not a function, so `await` never treats a chain as a promise
        get then() {
            return stage(state, bind)
        },
        get or() {
            return stage(
                { ...state, alternatives: [...state.alternatives, state.steps], steps: [] },
                bind,
            )
        },
        key: (name) => withStep({ kind: "press", key: name, ...state.pending }),
        hold: (name, threshold) =>
            withStep(
                threshold === undefined
                    ? { kind: "hold", key: name, ...state.pending }
                    : { kind: "hold", key: name, ...state.pending, threshold },
            ),
        wait: (ms) => stage({ ...state, pending: { ...state.pending, minDelay: ms } }, bind),
        in: (scope) => withOptions({ scopes: [scope].flat() }),
        except: (rule) => withOptions({ except: [rule] }),
        allowInInputs: () => withOptions({ allowInInputs: true }),
        priority: (level) => withOptions({ priority: level }),
        describe: (text) => withOptions({ description: text }),
        on: (handler) => register(bind, state, handler),
    }
}

/**
 * @name createChain
 * @description Builds the typed chain API. Every stage is an immutable plain object, so a partial
 * chain such as `shortcut.mod` can be reused. `on` turns the chain into a `BindingDefinition` and
 * hands it to `bind`: `registry.add` for plain JavaScript, `useBinding` in React so that `.on()`
 * registers inside an effect and unbinds on unmount. Scope names in `.in()` are the literal union
 * of `scopes` plus the built-in `web` and `desktop`.
 *
 * @example
 * const shortcut = createChain(["app", "palette"], registry.add)
 * const handle = shortcut.mod.key("k").in("app").on(openPalette)
 * handle.combo // "mod+k"
 */
export function createChain<const S extends readonly Scope[]>(
    scopes: S,
    bind: Bind,
): Shortcut<S[number] | Host> {
    return stage({ alternatives: [], steps: [], pending: EMPTY_PENDING, options: {} }, bind)
}
