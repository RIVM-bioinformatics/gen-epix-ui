---
name: create-unit-test
description: >-
  Create or update colocated Vitest unit tests for one eligible TypeScript
  source file or every eligible source file under a requested folder in this
  monorepo. Use when asked to create, add, extend, refresh, or update unit
  tests, including after implementation changes. Skip model, constant, index,
  setup, theme, declaration, configuration, test, generated, and api-* folder
  files, as well as files containing only types, enums, and constants; use the
  owning package's test configuration and require 100 percent coverage for
  every target module.
---

# Create or Update a Unit Test

## Scope and Eligibility

- Accept exactly one source-file path or one folder path per invocation. For a
  file, process that one target. For a folder, recursively discover and
  process every eligible target beneath it.
- Sort discovered targets by workspace-relative path and process them
  sequentially. Complete the full workflow and validation for one target
  before starting the next; do not combine unrelated modules into one test.
- If a folder contains no eligible targets, report that and make no edits.
- Target implementation files ending in `.ts` only. Do not create unit tests
  for `.tsx` files, declaration files, existing test/spec files, or generated
  output.
- Skip every file under `**/models/**`, `**/constants/**`, and `**/theme/**`,
  plus every `index.ts`, `setup.ts`, `*.d.ts`, `*.config.ts`, test/spec file,
  generated-output directory, dependency directory, and any directory matching
  `**/api-*`. Never test or create tests for a file inside an `api-*` folder,
  even when the file otherwise looks like an eligible implementation module.
  These exclusions apply even when the file contains executable code.
- Also skip any `.ts` file whose contents consist only of type declarations
  (`type` aliases and `interface` declarations), enum declarations, and
  constant data declarations, along with imports, exports, and comments. This
  includes files combining any of those declaration kinds. A `const` that
  defines executable behavior, such as a function, does not count as a constant
  data declaration. If a file also contains implementation behavior, it is not
  excluded by this rule.
- If the requested file is excluded or is not a TypeScript implementation
  module, contains only types/enums/constants, or is inside an `api-*` folder,
  explain why this skill does not apply and do not create a test. If a requested
  folder contains excluded files, silently omit them from discovery and report
  the exclusions in the final summary. If the requested folder itself matches
  `**/api-*`, report that the folder is excluded and make no edits.
- Preserve unrelated user changes and existing public APIs. Use the owning
  package's existing Vitest, TypeScript, and ESLint configuration rather than
  introducing new test infrastructure.

## 1. Review the Logic Before Editing Tests

Do not create, update, move, or rename a test for a target until that target's
assessment is complete.

For a folder request, first produce the sorted eligible-target list. Then
repeat the following review and test workflow independently for each target;
do not infer one module's contract or coverage from another module.

1. Read the current target module, its exported and internal functions, defaults,
   state changes, branches, return values, and exception paths. Read the
   nearest relevant call site, type contract, dependency, or fixture only
   where needed to establish intended behavior.
2. Inspect existing tests by both filename and imports of the target. An
   existing colocated test normally means it should be updated, not that a
   second test file should be added.
3. Compare the implementation with its contract and existing tests. Look for
   incorrect boundaries, inverted conditions, inconsistent defaults, mutation,
   missing validation, and incorrect error handling.
4. State the intended behavior and one cheap, focused check that could
   disprove the assessment. Derive expectations independently from the
   implementation under test.
5. If a likely production defect is found, stop and ask the user how to
   proceed before editing tests. Explain the source location, triggering input,
   expected versus actual behavior, and uncertainty. Offer fixing the module
   first, clarifying the contract, or explicitly authorizing a regression test.
   Do not silently fix production code, encode a suspected defect as expected
   behavior, or hide it with a skip or expected-failure marker.
6. If no likely defect is found, briefly record that assessment and proceed.
   This review does not prove the implementation correct.

If another likely implementation defect appears while writing or running the
test, stop the batch and apply the same approval gate before making further
test edits or moving to the next target. Do not continue with later targets
until the user authorizes the resolution.

## 2. Determine the Colocated Test

- Place each test in the same directory as its source module.
- Derive the filename from the source stem: `Widget.ts` becomes
  `Widget.test.ts`. Never add scenario names, alternate suffixes, or a second
  test file for the same source module. If the colocated test already exists,
  update it rather than creating a duplicate.
- Import the target directly from its local module when practical. Do not move
  tests into a package-level or feature-level test directory.
- Package Vitest configuration already discovers `src/**/*.test.ts` as unit
  tests. Do not add a launch configuration, package script, or coverage
  configuration solely for a colocated test.

## 3. Design the Coverage Matrix

Before writing assertions for each target, make a compact matrix for every
function, method, constructor, helper, and behavior-affecting module value in
that target. For each item, identify input partitions, expected results or
errors, side effects, and the test case that covers them.

Cover all applicable behavior, including:

- defaults, omitted arguments, explicit `undefined` or `null`, and positional
  versus keyword-like distinctions where the API supports them;
- empty, singleton, multiple-item, duplicate, ordered, malformed, and
  exhausted collections;
- values below, at, and above every boundary, including zero, negative, and
  unusually large values where relevant;
- empty and whitespace-only strings, valid and invalid formats, enum values,
  identifiers, paths, and dates where relevant;
- interacting arguments, repeated calls, state transitions, input mutation,
  and mutable defaults;
- dependency failures, expected exceptions, return shape and content, and
  observable side effects attributable to the target.

Use finite equivalence classes and boundary representatives for unbounded
inputs. Do not duplicate tests merely to inflate counts, and do not test the
behavior of dependencies. Explicitly disclose any inapplicable categories or
remaining gaps.

## 4. Write the Vitest Test

- Use Vitest APIs (`describe`, `it` or `test`, `expect`, and `vi`) and follow
  the nearest existing test style.
- Keep tests deterministic and focused on observable behavior. Use existing
  setup files and helpers; do not replace the package's test environment.
- For React hooks, use React Testing Library's `renderHook` and `act` from
  `@testing-library/react` so tests exercise the hook through React's real
  render and cleanup lifecycle. Do not mock React hook primitives to invoke a
  hook directly. If the owning package does not have React Testing Library as a
  test dependency, add it through `pnpm` before writing hook tests.
- Mock dependencies only at their boundary and where needed to isolate the
  target. Patch the symbol where the target looks it up, not where the symbol
  was originally declared. Restore spies, mocks, timers, and global state.
- Prefer parametrized cases for inputs that differ only in data. Use focused
  fixtures or builders when setup is reused, and do not share mutable objects
  across cases.
- Assert both successful and failure paths. Avoid assertions that merely copy
  the implementation's calculation or verify private call order when the
  resulting behavior can be checked directly.
- Keep the test file itself free of JSX so it remains a `.test.ts` unit test.

## 5. Validate 100 Percent Target Coverage

Run commands from the repository root and replace `<package>` and
`<test-path>` with the owning package name and colocated test path. For a
folder request, use the owning package for each target and run these commands
after each test edit, keeping validation scoped to the current target:

```bash
pnpm --filter <package> run lint-fix
pnpm --filter <package> run lint
pnpm --filter <package> run check-types
pnpm --filter <package> run test-run -- <test-path>
```

The package's `test-run` script runs Vitest with V8 coverage. The focused test
path should be the complete target test module, not an individual test case.
Inspect the coverage report for the target source file and require 100 percent
for statements, branches, functions, and lines. A passing test command alone
is not sufficient. Do not claim 100 percent by averaging unrelated files or by
changing coverage exclusions or thresholds.

If coverage is below 100 percent, identify the uncovered path, add the
smallest behavior-focused case that exercises it, and rerun the same focused
command before moving to another target. If the uncovered path is unreachable
or reflects a production defect, use the logic-review approval gate rather than
weakening the requirement or continuing the batch.

Do not commit generated `coverage/` output. Run the package's broader
`test-run` only when the request requires suite-level validation or when the
focused change affects shared test infrastructure.

## Final Checklist

- The request was one eligible `.ts` implementation file or one folder.
- For a folder request, every discovered eligible target was processed in
  sorted order, or the batch stopped at an authorized blocker.
- Every test is in the same folder as its target and ends in `.test.ts`.
- Excluded paths and files, including every `**/api-*` folder, were not tested
  and did not receive generated tests; this includes files containing only
  types, enums, and constants.
- Existing colocated coverage was updated rather than duplicated.
- Applicable branches, errors, boundaries, side effects, and state transitions
  are covered for every processed target.
- Every processed target reports 100 percent statements, branches, functions,
  and lines.
- Lint, type checking, and the focused test command pass for every processed
  target.
- No unrelated files, generated reports, package metadata, or configuration
  were changed.

Report the requested path, discovered eligible targets, skipped categories,
each source module and test path, behavior categories covered, validation
commands and results, and any unresolved or unverified requirements. For a
stopped folder batch, report the blocking target and the targets not yet
processed. Never claim a test or coverage result that was not actually
observed.
