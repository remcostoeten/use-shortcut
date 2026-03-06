#!/usr/bin/env sh
set -eu

PACKAGE="@remcostoeten/use-shortcut"

echo "Installing ${PACKAGE}..."

if command -v bun >/dev/null 2>&1; then
  bun add "${PACKAGE}"
elif command -v pnpm >/dev/null 2>&1; then
  pnpm add "${PACKAGE}"
elif command -v yarn >/dev/null 2>&1; then
  yarn add "${PACKAGE}"
else
  npm install "${PACKAGE}"
fi

cat <<'EOF'

Installed.

Use this AI prompt next:
- https://use-shortcut.vercel.app/ai-prompt.md

Useful machine-readable context:
- https://use-shortcut.vercel.app/llm.txt
- https://use-shortcut.vercel.app/agents.md

Suggested bindings:
  $.mod.key("k").on(openCommandPalette, { preventDefault: true })
  $.shift.key("slash").except("typing").on(() => setHelpOpen(true))

Optional generators:
  npx @remcostoeten/use-shortcut init
  npx @remcostoeten/use-shortcut scaffold
EOF
