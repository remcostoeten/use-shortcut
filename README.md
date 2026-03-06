# use-shortcut monorepo

Monorepo for `@remcostoeten/use-shortcut` and its docs site.

## Workspace

- `packages/use-shortcut`: published React keyboard shortcut package
- `apps/docs`: marketing and API docs site

## Commands

```sh
bun install
bun run build
bun run docs:dev
bun run docs:build
bun run docs:test
bun run docs:lint
```

## Notes

- The docs app consumes the local package through `workspace:*`.
- Vercel should point at `apps/docs`.
- `/use-shortcut` is preserved as a permanent redirect to `/` for compatibility.
