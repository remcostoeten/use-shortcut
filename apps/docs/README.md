# use-shortcut docs

Vite docs app for the `@remcostoeten/use-shortcut` monorepo.

## Structure

- `apps/docs`: this site
- `packages/use-shortcut`: the published package

## Commands

From the monorepo root:

```sh
bun install
bun run docs:dev
```

From this app directory:

```sh
bun run dev
```

## Notes

- The main docs page lives at `/`.
- `/use-shortcut` is kept as a compatibility route and redirects to `/`.
- `scripts/generate-sitemap.mjs` generates the public sitemap and robots files before production builds.
