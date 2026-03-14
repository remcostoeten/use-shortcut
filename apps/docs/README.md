# registry docs app

Registry shell for Remco Stoeten tools. It powers:

- the base registry landing page
- per-entry docs routes inside the registry
- package-mode deployments on their own domains

Examples:
- `registry.remcostoeten.nl`
- `use-shortcut.vercel.app`
- `use-shortcut.remcostoeten.nl`
- `analytics.remcostoeten.nl`

## Local development

This repo uses Bun as the primary package manager.

```bash
bun install
bun run dev
```

Useful scripts:

```bash
bun run build
bun run lint
bun run test
```

## What is in this repo

- registry landing page for packages, CLIs, and extensions
- reusable package/tool showcase route powered by config files
- transitional root-level `registry/` layer for entries and shared types
- copy-ready API examples and component recipes
- grounded docs assistant powered by local docs content
- machine-readable helper files like `llm.txt`, `agents.md`, and `skill.sh`

## How routing works

- `VITE_DOCS_MODE=registry` renders `/` as the registry and `/:slug` as entry pages.
- `VITE_DOCS_MODE=package` renders a single entry at `/` and redirects stray slugs.
- Per-entry external docs domains are configured through env vars named like `VITE_USE_SHORTCUT_DOCS_URL`.

## Current architecture

- `registry/entries/*` is the new neutral layer for package and tool entries.
- `apps/docs/src/config/registry.ts` consumes that layer and builds site-aware links.
- `apps/docs/src/config/types.ts` re-exports the shared registry types for compatibility while the UI is still being migrated.

## Environment

```bash
VITE_DOCS_MODE=registry
VITE_SITE_URL=https://registry.remcostoeten.nl
VITE_REGISTRY_SITE_URL=https://registry.remcostoeten.nl
VITE_REGISTRY_TITLE=@remcostoeten-registry
VITE_REGISTRY_OWNER=@remcostoeten

VITE_USE_SHORTCUT_DOCS_URL=https://use-shortcut.remcostoeten.nl
VITE_ANALYTICS_DOCS_URL=https://analytics.remcostoeten.nl
VITE_VSCODE_CODE_REFINERY_DOCS_URL=https://vscode-code-refinery.remcostoeten.nl
```

The slug-to-domain mapping follows `VITE_<SLUG>_DOCS_URL`, so adding a new entry does not require editing `site.ts`.
If you need package-mode for a dedicated domain, also set:

```bash
VITE_DOCS_MODE=package
VITE_PRIMARY_PACKAGE_SLUG=use-shortcut
VITE_SITE_URL=https://use-shortcut.remcostoeten.nl
```

`VITE_SITE_URL` is used by the app runtime. `SITE_URL` is also read by the sitemap generation script.
