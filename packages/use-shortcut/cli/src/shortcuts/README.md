# Shortcut Architecture Scaffold

This folder is the in-repo shortcut scaffold template.

It follows a scalable architecture with a strict split between:

- **Registry (data)**: `registry.ts` is the single source of truth for action ids, default keys, scope ownership, and metadata.
- **Runtime assembly**: `runtime.ts` converts registry + current bindings + handlers into a runtime map.
- **State and actions provider**: `provider.tsx` owns scope state, binding overrides, and persistence.
- **Storage adapter**: `storage.ts` isolates persistence so you can swap `localStorage` for API/DB.
- **Typed contract**: `types.ts` exposes `state/actions/meta` for UI and feature modules.

## How To Extend

1. Add a new action in `registry.ts`.
2. Implement its handler in your app and pass it via `handlers` to `<ShortcutProvider>`.
3. Optionally expose a user-configurable key in your settings UI through `useShortcutManager().actions.setBinding`.
4. Activate scopes from feature boundaries (for example editor route enters `editor` scope).

## Wiring A React App

Scaffold the shortcut files into a React app shell:

Copy this folder into an app when developing the local scaffold flow. The npm package no longer publishes a CLI binary, so `npx @remcostoeten/use-shortcut scaffold` is not a supported install path.

Then wire those generated files into your app root by wrapping your app in `<ShortcutProvider handlers={...} />`.

## Next.js Integration

1. Create a client provider wrapper at `app/shortcut-provider.tsx` and render `<ShortcutProvider />` there.
2. Render that provider inside `app/layout.tsx` around your app shell.
3. Keep page/server components pure; shortcut handlers stay in client components.

## Rules For Scale

- Keep handlers side-effect focused and feature-owned; keep the registry declarative.
- Use scopes instead of conditionals in handlers.
- Persist only key bindings, not executable handlers.
- Treat `registry.ts` as your architectural contract.
