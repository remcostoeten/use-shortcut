# Enterprise Documentation Orchestration Plan

## 1) Mission
Ship production-grade API documentation quality for `@remcostoeten/use-shortcut` with strong TypeScript IntelliSense (LSP), clear public/internal boundaries, and enforceable release gates.

## 2) Scope
- In scope:
  - Public package API docs (`src/index.ts` export surface)
  - Public CLI command docs
  - Scaffolded app API docs (`cli/src/shortcuts/*`)
  - Internal naming/doc policy enforcement (`_` prefix + no accidental public exposure)
  - Validation and release checklist for package content only
- Out of scope:
  - Docs site implementation, theming, routing, MDX plumbing, or deployment
  - New runtime features
  - Breaking API changes unless explicitly approved

## 3) Definition of Done (DoD)
Documentation quality is considered complete only when all are true:
1. Every public export has complete JSDoc:
   - summary
   - behavior notes
   - `@param` and `@returns` where applicable
   - at least one realistic example for user-facing functions/hooks
2. Internal helpers are clearly internal:
   - `_`-prefixed naming
   - not exported from package entrypoints
3. Public API inventory is accurate and current:
   - `PUBLIC_API.md` matches `src/index.ts` and CLI/scaffold surfaces
4. Quality gates pass:
   - `bun run typecheck`
   - `bun run test`
   - docs lint/check script (added in this plan)
5. Release readiness report is generated and reviewed.

## 4) Workstream Layout (Parallel Agents)

### Agent A: Public API JSDoc Hardening
- Ownership:
  - `src/index.ts`
  - `src/hook.ts`
  - `src/parser.ts`
  - `src/formatter.ts`
  - `src/constants.ts`
  - `src/types.ts` (public types only)
- Deliverables:
  - Top-tier JSDoc for all public exports
  - Explicit behavior notes for edge-cases and platform differences
- Acceptance criteria:
  - No public export lacks summary docs
  - Hook/function docs include usage examples

### Agent B: CLI & Scaffold Consumer Docs
- Ownership:
  - `cli/index.ts`
  - `cli/src/shortcuts/runtime.ts`
  - `cli/src/shortcuts/provider.tsx`
  - `cli/src/shortcuts/storage.ts`
  - `cli/src/shortcuts/scopes.ts`
  - `cli/src/shortcuts/index.ts`
  - `cli/templates.ts`
- Deliverables:
  - Command docs + flag semantics
  - JSDoc for scaffolded public helper functions/components
  - Template parity with source files
- Acceptance criteria:
  - Generated scaffold code has clear docs for end consumers
  - Template output and checked-in scaffold files are semantically aligned

### Agent C: Public/Private Boundary Enforcement
- Ownership:
  - `src/**`
  - `cli/**`
  - `PUBLIC_API.md`
- Deliverables:
  - Audit + fix any non-underscored internals
  - Verify no internal APIs are accidentally part of package public exports
  - Update API inventory
- Acceptance criteria:
  - Boundary check report with zero critical leaks

### Agent D: Tooling, Gates, and Release Evidence
- Ownership:
  - package validation outputs
  - docs QA artifacts
- Deliverables:
  - Run and capture package quality gates (`typecheck`, `test`)
  - Release report template (pass/fail matrix) for package content
  - Docs-site input bundle (content-only) for handoff after completion
- Acceptance criteria:
  - Package quality evidence is complete and reproducible

### Agent E (Optional): Generated API Reference Artifact
- Ownership:
  - `src/index.ts`
  - `src/**/*.ts` (public exports and JSDoc only)
  - `scripts/` (if a small extractor script is added)
  - generated artifact file(s)
- Deliverables:
  - Auto-generated, machine-readable API artifact from package surface (for docs ingestion), for example:
    - `docs-input/api-reference.json`
    - optional rendered companion `docs-input/api-reference.md`
  - Extraction rules:
    - include only symbols exported from `src/index.ts`
    - include summary/params/returns/examples from JSDoc when available
    - mark symbol kind (`function`, `type`, `const`)
    - include source path and line number
- Acceptance criteria:
  - Artifact can be regenerated deterministically
  - Artifact matches `PUBLIC_API.md` without drift

## 5) Execution Order and Dependencies
1. Agent C baseline audit (fast, produce issue list).
2. Agents A and B in parallel implement docs and naming fixes.
3. Agent C re-audit and reconcile drift.
4. Agent E (optional) generates API artifact for docs-site ingestion.
5. Agent D runs full package validation and final evidence capture.
6. Integrator final review + release report.

## 6) Branch/PR Strategy
- Branch naming:
  - `docs/ws-a-public-api-jsdoc`
  - `docs/ws-b-cli-scaffold-docs`
  - `docs/ws-c-boundary-enforcement`
  - `docs/ws-d-docs-gates`
- PR template requirements:
  - scope statement
  - before/after examples
  - risk + rollback plan
  - quality gate output

## 7) Review Rubric (Enterprise Standard)
All PRs reviewed against:
1. Correctness:
   - Docs reflect actual runtime behavior and types
2. Clarity:
   - User can understand usage without reading internals
3. Completeness:
   - No public symbol missing docs
4. Consistency:
   - Terminology uniform (`shortcut map`, `binding`, `scope`, `registration`)
5. Maintainability:
   - Minimal duplication, template/source parity preserved

## 8) Risk Register
- Risk: Docs drift between `cli/templates.ts` and `cli/src/shortcuts/*`
  - Mitigation: require parity checklist in Agent B + C audits.
- Risk: Over-documenting internals may imply public support
  - Mitigation: public docs only in exported surfaces; keep internal docs concise.
- Risk: Behavior mismatch in examples
  - Mitigation: examples should be type-checked where possible.

## 9) Deliverables
- `PUBLIC_API.md` (authoritative inventory)
- Updated JSDoc across public exports
- CLI/scaffold docs parity
- Final release report: `DOCS_RELEASE_REPORT.md`
- Docs-site handoff input (content-only):
  - API reference sections
  - examples/snippets
  - migration/usage notes
  - generated API artifact (if Agent E enabled)

## 10) Operational Checklist
- [x] Agent C baseline audit committed
- [x] Agent A PR merged
- [x] Agent B PR merged
- [x] Agent C re-audit merged
- [x] Agent E API artifact generated (optional)
- [x] Agent D checks merged
- [x] `bun run test` green
- [x] `bun run typecheck` green
- [x] `PUBLIC_API.md` verified against exports
- [x] Final release report approved

## 11) Integrator Command Set
```bash
# from packages/use-shortcut
bun run typecheck
bun run test
```

## 12) Ownership Matrix
- Integrator (you/me): cross-stream sequencing, merge conflict resolution, final sign-off
- Agent A: package API docs quality
- Agent B: CLI + scaffold docs quality
- Agent C: internal/public boundary governance
- Agent D: automation and release evidence
