---
name: frontend-feature-tdd-implementation
description: >-
  Guides frontend Test-Driven Development workflow for Next.js + React + TypeScript
  using Red-Green-Refactor. Use when implementing UI features with tests first,
  improving confidence in behavior, or following strict TDD for frontend work.
argument-hint: "[feature description or file path]"
---

# Frontend TDD Cycle Skill

## Overview

Guides the Red-Green-Refactor cycle for frontend features:
1. write a failing test for user-visible behavior,
2. implement the minimum code to pass,
3. refactor while keeping tests green.

You NEVER create commits.
You NEVER run `git add`, `git commit`, or `git push`.
At the end of each completed TDD slice, stop at handoff: provide a proposed commit message,
list changed files, and verification commands. The user reviews and performs the commit manually.

## Test Type Selection

| Test Type | Use For | Typical Location |
|-----------|---------|------------------|
| Unit test | Pure functions, formatters, mappers, utilities | `frontend/lib/**/__tests__/` |
| Component test | Rendering, accessibility, interactions | `frontend/components/**/__tests__/` |
| Page integration test | Route-level behavior + data loading/mutations | `frontend/app/**/__tests__/` |
| API client test | Request mapping, error envelope handling, retry/refresh logic | `frontend/lib/api/**/__tests__/` |
| E2E test | Critical user journeys across screens | `frontend/e2e/` |

## Workflow Steps

1. **Choose Test Type** -- Pick the right test level from the table above.
2. **Write Failing Test (RED)** -- Write a test for one user behavior (rendering, interaction, validation, loading state, API error state).
3. **Verify Failure** -- Run the smallest targeted command. The test must fail for the expected reason.
4. **Implement Minimal Code (GREEN)** -- Add only enough code to satisfy the failing test.
5. **Verify Pass** -- Re-run the targeted test; it must pass.
6. **Refactor** -- Improve naming, structure, duplication, and state flow without changing behavior.
7. **Final Verification** -- Run related test scope + static checks (lint/type/build where relevant).
8. **Handoff (No Commit)** -- Stop and provide:
   - Proposed commit message (`<type>(<scope>): <subject>`)
   - Why this commit exists (1-2 lines)
   - Changed files list
   - Commands run for verification
   - Explicit note: "Please review and commit manually."

## Agent Usage (Required)

Use specialized agents for each phase. Do not implement everything directly.

1. **RED phase** -- Use `frontend-test-agent` to write failing frontend tests and edge-case scenarios.
2. **GREEN phase** -- Use `frontend-green-agent` to implement the minimal code to pass.
3. **REFACTOR phase** -- Use `frontend-refactor-agent` to improve structure while preserving behavior.

For discovery and alignment before RED:
- Use `codebase-locator` to find related UI modules, hooks, and API client files.
- Use `codebase-pattern-finder` to reuse existing patterns for forms, tables, and error states.
- Use `codebase-analyzer` when behavior spans multiple layers (page + hook + API client).

When feature work includes API integration, load skill:
- `api-versioning` for endpoint contract alignment and stable request/response usage.

## Good Frontend Test Characteristics

- **One behavior per test**: each test verifies one visible outcome.
- **User-centric assertions**: assert what users see/do, not implementation internals.
- **Minimal setup**: only render required component/page and mock only needed dependencies.
- **Deterministic**: avoid timing flakes; control async with stable waiting patterns.
- **Independent**: no test-order coupling or leaked state.
- **Accessibility-aware**: prefer semantic queries and verify labels/roles.

## Refactoring Targets

- Extract repeated UI logic into hooks/utilities.
- Improve component boundaries (presentational vs stateful).
- Simplify async state transitions and error handling.
- Reduce prop drilling where complexity grows.
- Normalize API error mapping in one place.

## Refactoring Rules

1. Make ONE meaningful change at a time.
2. Run targeted tests after EACH change.
3. If tests fail, revert that refactor step and choose a safer variant.
4. Stop when code is clearer and still minimal.
5. Stop before commit and handoff to user for review/commit.
6. Always prefer `frontend-test-agent` -> `frontend-green-agent` -> `frontend-refactor-agent`.

## Frontend Verification Commands

Use the smallest command first, then expand scope:

- Targeted test file:
  - `npm run test -- path/to/test-file`
- Related test scope:
  - `npm run test -- path/to/folder`
- Lint:
  - `npm run lint`
- Type check (if script exists):
  - `npm run typecheck`
- Build validation:
  - `npm run build`
- E2E critical paths (if configured):
  - `npm run test:e2e`

If a script is missing, do not invent one silently. Use available scripts and report any gaps.

## Output Handoff Template

```markdown
Proposed commit message:
feat(frontend): <subject>

Why:
- <1-2 lines on user value and behavior added>

Changed files:
- frontend/...

Verification commands run:
- npm run test -- <target>
- npm run lint
- npm run build

Please review and commit manually.
```
