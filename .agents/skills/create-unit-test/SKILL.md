---
name: create-unit-test
description: >-
  Create or update colocated Vitest tests for one TypeScript file or a folder
  in this monorepo. Use for .ts unit tests and .tsx React component/browser
  tests, including after implementation changes. Use the owning package's
  unit or browser project and require 100 percent coverage per target.
---

# Create or Update a Unit or Browser Test

## Scope and Eligibility

- Accept exactly one source-file path or one folder path per invocation. For a
  file, process that one target. For a folder, recursively discover and
  process every eligible target beneath it.
- Sort discovered targets by workspace-relative path and process them
  sequentially. Complete the full workflow and validation for one target
  before starting the next; do not combine unrelated modules into one test.
- If a folder contains no eligible targets, report that and make no edits.
- Target `.ts` and `.tsx` implementations. The **source extension**, not
  whether the first test happens to need JSX, determines the project.
- Skip every file under `**/models/**`, `**/constants/**`, and `**/theme/**`,
  plus `**/src/test/**` (helpers, wrappers, fixtures and setup), every
  `index.ts(x)`, `setup.ts(x)`, `*.d.ts`, `*.config.ts(x)`, test/spec file,
  generated-output directory, dependency directory, and any directory matching
  `**/api-*`. Never test or create tests for a file inside an `api-*` folder,
  even when the file otherwise looks like an eligible implementation module.
  These exclusions apply even when the file contains executable code.
- Also skip any `.ts` or `.tsx` file whose contents consist only of type declarations
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
- This skill may make a minimal production fix when tests or monorepo
  validation expose a confirmed defect or an affected caller. Keep the public
  API and all behavior outside the confirmed defect backward-compatible; do not
  change implementation merely to match an incorrect test expectation or reach
  coverage. After creating all requested tests, run `pnpm run validate` from
  the repository root. If it fails because another package needs to adapt,
  update that package with a backward-compatible fix and rerun validation until
  it passes.
- Never silently introduce a backward-incompatible change. If a necessary fix
  would break a public API or existing supported behavior, stop and ask the
  user to approve that specific change before implementing it. In the final
  summary, list the production changes and clearly identify every
  backward-incompatible change introduced; state explicitly when there are
  none.

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
5. If a likely production defect is found, do not encode the defect as expected
   behavior or hide it with a skip or expected-failure marker. Establish the
   intended behavior from the public contract and relevant callers, then add a
   focused test for that behavior. If the contract or cause is uncertain, stop
   and ask the user to clarify before writing the test or changing production
   code. A confirmed defect may be fixed after the test is in place, provided
   the fix is backward-compatible. If it cannot be fixed without a breaking
   change, ask the user to approve that specific change.
6. If no likely defect is found, briefly record that assessment and proceed.
   This review does not prove the implementation correct.

If another likely implementation defect appears while writing or running the
test, pause that target and follow step 5. Continue only after the behavior is
established and the target's tests and focused validation are complete. If the
issue remains ambiguous or requires a breaking change that the user has not
approved, stop the batch and report the blocking target and unprocessed targets.

## 2. Determine the Colocated Test

- Place each test in the same directory as its source module.
- Keep the source extension: `Widget.ts` becomes `Widget.test.ts` (Vitest
  `unit`, jsdom); `Widget.tsx` becomes `Widget.test.tsx` (Vitest `browser`,
  Playwright Chromium). Never add scenario names, alternate suffixes, or a second
  test file for the same source module. If the colocated test already exists,
  update it rather than creating a duplicate.
- Import the target directly from its local module when practical. Do not move
  tests into a package-level or feature-level test directory.
- Package Vite configs already discover both patterns. Do not add a launch
  configuration, runner, package script or coverage exemption for a target.
  If the browser binary is missing, run `pnpm --filter <package> exec playwright install chromium`.

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
- For `.ts` React hooks, use React Testing Library's `renderHook` and `act` from
  `@testing-library/react` so tests exercise the hook through React's real
  render and cleanup lifecycle. Do not mock React hook primitives to invoke a
  hook directly. If the owning package does not have React Testing Library as a
  test dependency, add it through `pnpm` before writing hook tests.
- In `.test.ts` unit tests, mock dependencies only at their boundary and where needed to isolate the
  target. Patch the symbol where the target looks it up, not where the symbol
  was originally declared. Restore spies, mocks, timers, and global state.
- Parameterize similar cases. When two or more `it`/`test` blocks share the same
  arrange and assert steps and differ only in data, merge them into one
  `it.each([...])` (or `test.each`) table. Name each row in the title with
  `$field` placeholders (for example `'shows an error when $reason'`), and make
  the title describe the assertion that actually runs; do not claim "without
  failing" when the test expects an error. Use focused fixtures or builders
  when setup is reused, and do not share mutable objects across cases.
- Use specific matchers. Write `expect(list).toHaveLength(n)` instead of
  `expect(list.length).toBe(n)`, and `toBe`/`toEqual` only for the value type
  they fit. This applies to arrays, NodeLists and `.elements()` results alike.
  Use `expect.poll` only when the value is genuinely asynchronous.
- Only mark a function `async` when it contains an `await`. This applies to
  test callbacks, helpers and render wrappers. A helper that only returns a
  promise, such as `renderComponent` returning the render promise, should be
  a plain function (`const renderX = (...) => render(...)`). Marking such a
  helper `async` triggers SonarCloud S7503.
- Throw `new Error(...)`, never `throw Error(...)`, in test helpers and
  production code alike.
- Always pass a compare function to `Array.prototype.sort`, such as
  `.sort((a, b) => a.localeCompare(b))`. A bare `.sort()` triggers SonarCloud
  S2871 (CRITICAL) in production code, and test code should follow the same
  rule.
- Keep helper functions small. Test helpers and component render logic that
  branch heavily should move each branch into a named helper so the enclosing
  function stays under SonarCloud's cognitive complexity limit (S3776). Do not
  add nested ternaries or long `if` chains inside a single function. Move
  branch logic into module-scope pure helpers and keep the branch order
  unchanged.
- Assert both successful and failure paths. Avoid assertions that merely copy
  the implementation's calculation or verify private call order when the
  resulting behavior can be checked directly.
- Keep `.test.ts` files free of JSX. For `.test.tsx`, use the browser workflow below.

### Browser components (`.test.tsx`)

1. **Use the owning package's renderer.** In `ui-client-common`, `ui-client-casedb`,
   `ui-client-seqdb`, `ui-client-omopdb`, `ui-core-components` and `ui-core-form`,
   import `renderComponent` from that package's `src/test/lib` (a relative import
   from the test, or `@gen-epix/<own-package>/test/lib`). Use
   `const screen = await renderComponent(<Widget {...props} />)` inside an
   `it` callback that is `async` only because it awaits. The `renderComponent`
   helper itself is not `async`; do not add `async` to any render helper or
   to a test callback that contains no `await`.
   Do not import a different client's renderer or run setup manually.
   - Clients already get their standard config, demo theme, initialized English
     and Dutch translations, Emotion and the app's DI-backed React Query client.
     Use `{ language: 'nl', configure: config => { ... } }` for case-specific
     inputs. The app shell, login flow and router are not mounted. For a `Link`
     or `useLocation`, pass `{ wrapper: MemoryRouter }` from `react-router-dom`;
     use a memory **data** router for `useMatches`. Additional providers passed
     via `wrapper` compose with, rather than replace, the package providers.
   - Core components get MUI and i18n; core form also gets a real `FormProvider`.
     Pass `{ form: { defaultValues: ... } }` for field inputs. `ui-core` and
     `ui-phylogenetic-tree` have no client wrapper: use `render` from
     `vitest-browser-react` with just the target's required providers; see
     `packages/ui-phylogenetic-tree/src/components/PhylogeneticTree/PhylogeneticTree.test.tsx`.
   - Do not call React's `act` (from `react` or `react-dom/test-utils`) in browser
     tests. `vitest-browser-react` enables the act environment only inside its own
     `render`, `rerender` and `unmount` wrappers, so a direct `act(...)` call triggers
     "The current testing environment is not configured to support act(...)" warnings.
     Call component methods, ref methods or state setters directly and assert with
     `await expect.element(...)`, which retries until the DOM settles.
2. **Do not mock or spy on utilities**, including their module exports, or
   replace data hooks just to manufacture component states. Vary props,
   callback presence, config, initial state, request data/status and user
   actions to reach branches. Drive the real component with browser locators
   and awaited user actions; use assertions such as
   `await expect.element(screen.getByRole('alert')).toBeVisible()` for DOM updates.
   Cover loading, empty, success and error states where they exist.
   Use `await screen.rerender(...)` to test transitions without remounting.
   When a necessary element cannot be targeted reliably through accessible
   roles, labels or text, add a test id to the component for testability. Always
   create test-id attributes with `TestIdUtil.createAttributes(...)` from
   `@gen-epix/ui-core/utils/TestIdUtil`; do not hardcode `data-testid`.
3. **Mock HTTP, not the SDK or Axios.** Register responses inside the test or
   its `beforeEach`, before rendering. Client browser setup intercepts both
   XHR and fetch for the test API; an unhandled API request fails the test.
   Cases must not run concurrently in the same file (DI and transport are per test).
   For example, import `createOrganization`, `mockOrganizations` and
   `mockApiRequest` from `@gen-epix/ui-client-common/test/lib`:
   - Success: `mockOrganizations([createOrganization({ name: 'North' })])`.
   - Empty: `mockOrganizations([])`.
   - Error: `mockApiRequest('GET', '/v1/organizations', () => Response.json({ detail: 'Unavailable' }, { status: 503 }))`.
   - Match the actual SDK method and pathname (no host or query string). The
     responder gets the real `Request`; inspect its URL/body or return a
     promise to hold a request pending for a loading-state assertion.
4. Look in the owning package's `src/test/` **before** inventing fixtures.
   Keep reusable builders, HTTP handlers and provider helpers there, not
   alongside production code. Share cross-client fixtures through
   `ui-client-common/src/test/lib`; keep domain-specific records in the domain
   package. Return fresh typed SDK data per case. Never import browser-only
   helpers into jsdom unit tests or production modules.
5. **Give rendered list items unique keys.** React warns "Encountered two children
   with the same key" when sibling items share a key, and that warning is only
   logged, so tests still pass. Do not build fixtures from identical sibling
   objects when the component keys them. Vary a distinguishing field such as
   `id`, `name`, `size` or `index`. Keys derived from a content hash (for example
   `StringUtil.createHash(JSON.stringify(item))`) collide for identical items, so
   the fixture must differ. Build lists with `Array.from({ length }, (_, index) => ...)`
   and include `index` in the varying field.

## 5. Validate 100 Percent Target Coverage

Run commands from the repository root and replace `<package>` and
`<test-path>` and `<source-path>` with paths relative to that package
(`src/...`, not `packages/...`). Select `unit` for `.ts` or `browser` for `.tsx`. For a
folder request, use the owning package for each target and run these commands
after each test edit, keeping validation scoped to the current target:

```bash
pnpm --filter <package> run lint-fix
pnpm --filter <package> run lint
pnpm --filter <package> run check-types
pnpm --filter <package> exec vitest run --project <unit-or-browser> --coverage --coverage.include=<source-path> <test-path>
```

Vitest's default summary hides console output, so React warnings such as
duplicate keys are invisible there. After the coverage run, rerun the focused
command with `--reporter=verbose` and check both streams. Vitest prints console
output to stderr and stdout, so search both:

```bash
pnpm --filter <package> exec vitest run --project <unit-or-browser> --reporter=verbose <test-path> > /tmp/unit-test-verbose.log 2>&1
grep -nE "same key|two children" /tmp/unit-test-verbose.log
```

The grep must find nothing. Any match means a sibling fixture or component key
needs fixing; the test is not complete until it is clean. Delete the temporary
log afterwards.

Use the configured V8 coverage provider and **verify the intended file actually
ran** (do not use `--passWithNoTests` for this check). The focused test
path should be the complete target test module, not an individual test case.
Inspect the coverage report for the target source file and require 100 percent
for statements, branches, functions, and lines. A passing test command alone
is not sufficient. Do not claim 100 percent by averaging unrelated files or by
changing coverage exclusions or thresholds.

If coverage is below 100 percent, identify the uncovered path, add the
smallest behavior-focused case that exercises it, and rerun the same focused
command before moving to another target. If the uncovered path is unreachable
or reflects a production defect, do not weaken the requirement; resolve it with
a backward-compatible fix or stop and ask the user if a breaking change is
necessary.

Do not commit generated `coverage/` output. Run the package's broader
`test-run` only when the request requires suite-level validation or when the
focused change affects shared test infrastructure.

After all requested tests have been created or updated, run `pnpm run validate`
from the repository root. If validation identifies affected callers or
implementations in other monorepo packages, fix them without breaking existing
public contracts and rerun `pnpm run validate`. Do not report the task complete
until the root validation passes.

## Final Checklist

- The request was one eligible `.ts` or `.tsx` implementation file or one folder.
- For a folder request, every discovered eligible target was processed in
  sorted order, or the batch stopped at an authorized blocker.
- Every test is colocated and ran in the project matching its extension.
- Browser components used the package's renderer where available, real utils,
  and HTTP fixtures for requests; shared test support stayed under `src/test/`.
- Excluded paths and files, including every `**/api-*` folder, were not tested
  and did not receive generated tests; this includes files containing only
  types, enums, and constants.
- Existing colocated coverage was updated rather than duplicated.
- Applicable branches, errors, boundaries, side effects, and state transitions
  are covered for every processed target.
- Similar cases are merged into `it.each` tables with titles that match the
  assertions. Assertions use specific matchers such as `toHaveLength`, and
  no function is marked `async` without an `await`. Errors are thrown with
  `new Error`. Branch-heavy helpers were split so complexity stays low. These
  checks cover SonarCloud rules S5976, S5906, S7503, S7723, S2871 and S3776,
  which lint does not enforce.
- Every processed target reports 100 percent statements, branches, functions,
  and lines.
- Lint, type checking, and the focused test command pass for every processed
  target.
- The verbose focused run has no "same key" or "two children" warnings in
  stderr or stdout.
- Root `pnpm run validate` passes after all requested tests and any
  backward-compatible monorepo fixes are complete.
- No unrelated files, generated reports, package metadata, or configuration
  were changed.
- Production changes are listed in the final summary, with all
  backward-incompatible changes explicitly identified or reported as none.

Report the requested path, discovered eligible targets, skipped categories,
each source module and test path, behavior categories covered, validation
commands and results, and any unresolved or unverified requirements. For a
stopped folder batch, report the blocking target and the targets not yet
processed. Never claim a test or coverage result that was not actually
observed.
