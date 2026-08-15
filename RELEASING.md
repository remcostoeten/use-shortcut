# Releasing

One command cuts a release. It resolves the next version, writes it everywhere,
generates the changelog entry and release notes from the commits, runs the
package gate, then commits, tags, pushes, publishes, and opens the GitHub
release.

```sh
bun run release            # patch: 2.5.1 -> 2.5.2
bun run release minor      # 2.5.1 -> 2.6.0
bun run release major      # 2.5.1 -> 3.0.0
bun run release 2.8.0      # explicit, must be higher than the current version
bun run release:dry        # print everything, change nothing
```

## What it does

1. Reads the current version from every file in `_VERSION_TARGETS`, failing if
   they disagree.
2. Resolves the next version. An explicit version must parse as `x.y.z` and be
   strictly higher than the current one.
3. Refuses to continue unless you are on `master`, the tree is clean, the tag
   is free, and the version is not already on npm.
4. Collects the commits since the last tag **that touched
   `packages/use-shortcut`**, so docs-site and tooling work never lands in the
   package changelog and never on its own justifies a release.
5. Groups them by conventional-commit type into Keep a Changelog sections and
   prints both the changelog entry and the release notes for review.
6. On confirmation: writes the version, inserts the changelog entry, runs
   `bun run verify`, commits, tags, pushes, publishes, and creates the GitHub
   release.

Nothing is written before the confirmation prompt. Pass `--yes` to skip it.

## Flags

| Flag | Effect |
| --- | --- |
| `--dry-run` | Print the plan and generated text; touch nothing |
| `--yes`, `-y` | Skip the confirmation prompt |
| `--no-verify` | Skip `bun run verify` |
| `--no-push` | Do not push master or the tag |
| `--no-publish` | Do not publish to npm |
| `--no-github-release` | Do not create the GitHub release |

## Commit types

`feat` becomes **Added**, `fix` becomes **Fixed**, `perf` / `refactor` /
`revert` become **Changed**, and `docs` becomes **Documentation**. Anything
else — `chore`, `test`, `ci`, `build`, `style` — is left out of the changelog
and collapsed under "Other commits" in the release notes.

A `!` after the type (`feat!:`) or a `BREAKING CHANGE:` line in the body marks
the entry **BREAKING** and warns if the release is not a major.

## Adding a new file that carries the version

Add one entry to `_VERSION_TARGETS` in `scripts/release.mjs` with a `read` and
a `write`. The script verifies its own write and fails if the version did not
land, so a stale regex cannot silently skip a file.
