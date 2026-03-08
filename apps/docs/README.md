# use-shortcut docs

Docs site for [`@remcostoeten/use-shortcut`](https://www.npmjs.com/package/@remcostoeten/use-shortcut).

Live docs:
- https://use-shortcut.vercel.app/use-shortcut

Repository:
- https://github.com/remcostoeten/use-shortcut

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

- marketing and docs site for `use-shortcut`
- copy-ready API examples and component recipes
- grounded docs assistant powered by local docs content
- machine-readable helper files like `llm.txt` and `skill.sh`

## Skills and helper files

- `public/skill.sh` exposes the `skills.sh` install command
- `public/llm.txt` gives LLMs package-specific implementation guidance
- `skills/use-shortcut/SKILL.md` contains the local agent skill

## Site URL

The docs site URL defaults to `https://use-shortcut.vercel.app`.

If you deploy this elsewhere, set:

```bash
VITE_SITE_URL=https://your-domain.example
SITE_URL=https://your-domain.example
```

`VITE_SITE_URL` is used by the app runtime. `SITE_URL` is also read by the sitemap generation script.
