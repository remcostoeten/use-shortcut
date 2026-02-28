# LLM Architecture Contract: App Shortcuts

Use this contract when generating or modifying shortcut architecture for React or Next.js apps.

## Objective

Create a reusable keyboard architecture with clear boundaries:

- Declarative action catalog.
- Injectable handler implementation.
- Scope-based activation.
- Persisted user bindings.
- Provider-owned lifecycle and registration.

## CLI Entry Points

- `use-shortcut scaffold`
- `use-shortcut scaffold --framework react`
- `use-shortcut scaffold --framework next --target src --dir shortcuts --force`

## Required Files

- `scopes.ts`
- `registry.ts`
- `types.ts`
- `runtime.ts`
- `storage.ts`
- `provider.tsx`
- `index.ts`
- `README.md`

## Invariants

- `registry.ts` is the single source of truth for action ids and default keys.
- `provider.tsx` owns state and side effects.
- `runtime.ts` is a pure transform layer.
- `storage.ts` never stores handlers, only key bindings.
- Scope activation is managed through typed `ShortcutScope` values.

## Extension Protocol

When adding an action:

1. Add action metadata in `registry.ts`.
2. Ensure action id appears in handler map type through inference.
3. Inject runtime handler in provider usage site.
4. If user-configurable, expose through `setBinding` and `resetBinding`.
5. Assign explicit scope ownership.

When changing persistence:

1. Keep `ShortcutBindings` shape stable.
2. Replace storage adapter implementation only.
3. Preserve provider action signatures.

## Anti-Patterns To Avoid

- Inline shortcut definitions scattered across pages/components.
- Handler logic coupled to registry constants in UI components.
- Untyped scope strings outside `ShortcutScope`.
- Implicit scope logic inside handlers.
- Persisting executable code/functions.

## Validation Checklist

- All registry actions have handlers or intentional no-op behavior.
- Shortcut map generation remains pure and deterministic.
- Provider cleans up registrations on config changes.
- Scope transitions are tested (enable/disable/set).
- Bindings persistence gracefully handles malformed stored data.
