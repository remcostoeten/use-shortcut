# App Shortcut Architecture

This guide describes the recommended scalable architecture for keyboard shortcuts in React and Next.js applications using `@remcostoeten/use-shortcut`.

## Design Principles

- Keep shortcut definitions declarative and centralized.
- Keep runtime handlers feature-owned and injectable.
- Model activation with named scopes instead of ad hoc boolean checks.
- Keep persistence isolated from runtime registration.
- Expose a typed state/actions/meta contract through context.

This gives clear ownership:

- `registry.ts`: architecture contract and source of truth.
- `runtime.ts`: transforms registry + bindings + handlers into runtime map.
- `provider.tsx`: owns lifecycle, persistence, scope state, and registration.
- `types.ts`: typed API for the rest of the application.

## Generated File Roles

- `scopes.ts`
  Defines allowed scopes and default active scopes.
- `registry.ts`
  Defines shortcut action ids, defaults, descriptions, and scope ownership.
- `types.ts`
  Defines `ShortcutState`, `ShortcutActions`, `ShortcutMeta`, and handlers contract.
- `runtime.ts`
  Converts declarative state into `ShortcutMap` consumed by the runtime.
- `storage.ts`
  Persists user key overrides (`localStorage` by default).
- `provider.tsx`
  Integrates with `useShortcut`, registers map, and exposes state/actions.
- `index.ts`
  Re-exports the architecture API for app imports.

## Runtime Flow

1. `registry.ts` defines all actions and default keys.
2. `provider.tsx` loads persisted binding overrides and active scopes.
3. `runtime.ts` creates the runtime map from current bindings + injected handlers.
4. Provider registers the map and handles cleanup on reconfiguration.
5. Feature code uses `useShortcutManager()` to adjust scopes and bindings.

## Scaling Pattern

When adding a new shortcut action:

1. Add action metadata to `registry.ts`.
2. Implement handler in a feature module.
3. Inject handler into `<ShortcutProvider handlers={...} />`.
4. Optionally expose binding controls in app settings using `setBinding`.
5. Activate the required scope from route/layout or feature boundary.

## Integration Guidance

## Next.js (App Router)

- Create a client wrapper component around `ShortcutProvider`.
- Render that wrapper in `app/layout.tsx`.
- Keep handlers in client boundary modules; server components remain pure.

## React (SPA)

- Wrap app root in `ShortcutProvider`.
- Memoize handlers (`useMemo`, `useCallback`) to avoid unnecessary re-registers.
- Adjust scopes from route containers or feature roots.

## Persistence Strategy

Default scaffold uses localStorage for user custom bindings.

If you need server persistence:

1. Keep `registry.ts` unchanged.
2. Replace `storage.ts` implementation with API read/write.
3. Keep the same `ShortcutBindings` type and provider action contract.

## Operational Checklist

- Keep action ids stable once shipped (prevents broken user bindings).
- Prefer scopes over runtime `if` branching in handlers.
- Keep global shortcuts in `global` scope only.
- Treat `registry.ts` as a public contract for your app team.
- Add tests around `runtime.ts` map generation and provider scope transitions.
