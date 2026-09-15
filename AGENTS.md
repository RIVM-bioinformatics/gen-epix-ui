# Agent Instructions

These instructions are the shared repository context for coding agents working on
`RIVM-bioinformatics/gen-epix-ui`. Keep this file tool-agnostic: GitHub
Copilot, Codex, and Claude Code should all be able to consume it without a
separate copy.

## Repository Overview

Gen-EpiX UI is a pnpm/Lerna monorepo for the frontend libraries and demo clients
of the Gen-EpiX genomic epidemiology platform.

- `packages/ui-client-common`: core React component library shared by all Gen-EpiX frontends.
- `packages/ui-client-casedb`: Case DB UI built on top of `@gen-epix/ui-client-common`.
- `packages/ui-client-omopdb`: OMOP DB UI built on top of `@gen-epix/ui-client-common`.
- `packages/ui-client-seqdb`: Sequence DB UI built on top of `@gen-epix/ui-client-common`.
- `packages/api-casedb`: generated Case DB API client.
- `packages/api-commondb`: generated Common DB API client.
- `packages/api-omopdb`: generated OMOP DB API client.
- `packages/api-seqdb`: generated Sequence DB API client.
- `examples/demo-client-casedb`: Case DB Vite demo app with an OIDC mock server.
- `examples/demo-client-omopdb`: OMOP DB Vite demo app with an OIDC mock server.
- `examples/demo-client-seqdb`: Sequence DB Vite demo app with an OIDC mock server.

The repo uses TypeScript, Vite, React 19, MUI 9, TanStack Query, React Hook
Form, TipTap, Zustand, Vitest, ESLint, `vite-plugin-dts`, and generated OpenAPI
clients.

## Agent Workflow

- Start from the most concrete anchor available: a file, symbol, failing command,
 failing test, or nearby implementation.
- Keep investigation local until there is one falsifiable hypothesis and one
 cheap check that can disprove it.
- Make the smallest useful edit, then immediately run the narrowest relevant
 validation.
- Do not rewrite generated files, package metadata, lockfiles, or release config
 unless the task requires it.
- Do not revert user changes. Work with the current worktree and ignore unrelated
 dirty files.
- Prefer existing local patterns and helpers over new abstractions.
- Preserve public package APIs unless the requested change explicitly requires a
 breaking change.
- Use ASCII in edited files unless the file already uses non-ASCII for a clear
 reason.

## Graphify First

This repository has a generated graph in `graphify-out/graph.json`. For any
question about architecture, file relationships, component ownership, where code
lives, or how to add or modify behavior, query the graph before broad source
search:

```sh
graphify query "<question>"
```

Use these related commands when they fit better:

```sh
graphify path "<source concept>" "<target concept>"
graphify explain "<concept>"
```

Use `graphify-out/wiki/index.md` for broad navigation if present. Read
`graphify-out/GRAPH_REPORT.md` only for broad architecture review or when
`query`, `path`, or `explain` do not provide enough context. Read source files
when modifying/debugging specific code, when graph output lacks the needed
detail, or when the graph is stale.

## Package Management

- Use `pnpm`. The root `packageManager` is `pnpm@11.13.1`.
- Do not use `npm install` or `yarn` in this repo.
- Keep workspace dependencies as `workspace:^` where existing packages do so.
- Root scripts are orchestrated through Lerna.
- Avoid manually editing `pnpm-lock.yaml` except as the result of a package
 manager command.

## Common Commands

Install dependencies:

```sh
pnpm install
```

Start local demo apps with their OIDC mock server:

```sh
pnpm start
pnpm start-omop
pnpm start-seq
```

Validate all packages:

```sh
pnpm run validate
```

Run focused commands for one package:

```sh
pnpm --filter @gen-epix/ui-client-common run lint
pnpm --filter @gen-epix/ui-client-common run lint-fix
pnpm --filter @gen-epix/ui-client-common run check-types
pnpm --filter @gen-epix/ui-client-common run test-run
pnpm --filter @gen-epix/ui-client-common run validate
pnpm --filter @gen-epix/ui-client-common run build
```

Other useful root commands:

```sh
pnpm run lint
pnpm run lint-fix
pnpm run check-types
pnpm run test
pnpm run build
pnpm run generate-api
pnpm run add-missing-translations
```

## Validation Expectations

- After changing TypeScript or React code, run the package's `lint-fix` command
 before trying to solve ESLint problems manually. ESLint may need multiple
 `--fix` iterations as earlier fixes can reveal follow-up fixes. Only inspect
 and repair remaining lint errors after auto-fix stops making progress.
- After lint auto-fix is exhausted, run `lint`, `check-types`, and the narrowest
 relevant tests.
- Prefer package-scoped validation over whole-repo validation while iterating.
- For changed UI library files, run the owning package's `test-run` when tests
 exist; Vitest uses `--passWithNoTests` in package scripts.
- For translation changes, run the package's `test-missing-translations` or the
 root `add-missing-translations` flow when appropriate.
- For generated API clients, prefer regenerating through `pnpm run generate-api`
 or the relevant package script instead of hand-editing generated output.
- For documentation-only edits, a focused diff review is acceptable when no
 executable validation applies.

## Code Style

- TypeScript is ESM throughout package code.
- Follow the repo ESLint config and existing formatting. Do not reformat
 unrelated code.
- Prefer named, descriptive variables. Do not introduce one-letter variables.
- Keep comments sparse and useful; explain non-obvious behavior, not simple
 assignments.
- Keep imports and exports aligned with package entrypoints.
- Do not leak private internal types through exported public props or package
 exports.
- Preserve strict type behavior; avoid `any` unless the surrounding generated or
 compatibility code already requires it.

## React And UI Conventions

- Match existing MUI-based design patterns and component composition.
- Keep shared, domain-neutral UI in `packages/ui-client-common`.
- Keep Case DB, OMOP DB, and Sequence DB behavior in their domain packages.
- Prefer existing hooks, managers, services, routing helpers, table helpers,
 filter helpers, and form field components before adding new ones.
- Be careful with React Router versions: this repo has both `react-router` and
 `react-router-dom` dependencies in different contexts.
- Treat browser-only test helpers and package exports carefully so unit and
 browser test modes both continue to resolve.
- Avoid render-time mutations and unstable refs in hooks and components.
- Keep MUI theme augmentation types compatible with optional custom theme keys.

## API Client Conventions

- API packages are generated from OpenAPI schemas with `generate-api` scripts.
- Do not hand-edit generated API code unless the task is explicitly about a local
 generator workaround and regeneration is not feasible.
- Keep shared API behavior in `packages/api-commondb` when it is common to all
 domain clients.
- When build output or declaration generation fails, check `vite-plugin-dts`,
 `entryRoot`, source export boundaries, and copied static/package manifest
 behavior before applying local patches.

## Testing Notes

- Package UI tests use Vitest and may collect coverage.
- Some browser-oriented tests require Playwright/browser dependencies.
- Prefer the package script over invoking raw `vitest` unless there is a specific
 reason.
- Keep tests focused on observable behavior and existing public APIs.
- Do not broaden snapshots or coverage churn while fixing a narrow bug.

## Demo App Notes

- Demo clients live under `examples/` and are development sandboxes, not
 publishable libraries.
- The root `start`, `start-omop`, and `start-seq` scripts run a Vite app plus the
 OIDC mock server concurrently.
- Local auth depends on `oidc-mock-server.config.json`; copy from
 `oidc-mock-server.config.example.json` if the config is missing.
- Keep demo routing and app setup aligned with the related domain package.

## Generated And Build Artifacts

- Do not edit `dist`, coverage output, or generated graph artifacts unless the
 task explicitly targets them.
- Do not commit accidental generated metadata for agent tools.
- Preserve release configuration and changelogs unless release work is requested.

## Agent Customization Source Of Truth

This repo keeps shared agent assets under `.agents`.

- Put repository-wide agent context in `AGENTS.md`.
- Put reusable skills in `.agents/skills/<skill-name>/SKILL.md`.
- Put reusable hook/helper scripts in `.agents/scripts/`.
- Keep `CLAUDE.md` as a thin wrapper that imports `@AGENTS.md`.
- Keep `.claude/skills` as a symlink to `../.agents/skills`.
- Do not create duplicated skill copies in `.github/skills`, `.codex/skills`, or
 `.claude/skills/<skill-name>`.
- Do not keep generated `agents/openai.yaml` files.

When creating or updating skills:

- Use lowercase hyphenated skill names.
- Use only `name` and `description` in skill YAML frontmatter unless a local
 convention requires more.
- Put trigger phrases in the `description`; the skill body only loads after the
 skill is selected.
- Keep skill bodies concise and procedural.
- Reference shared scripts by `.agents/scripts/...` paths.

Validate agent wiring with:

```sh
test -f .agents/skills/<skill-name>/SKILL.md
test ! -e .agents/skills/<skill-name>/agents/openai.yaml
find .agents/skills -maxdepth 2 -type f | sort
find -L .claude/skills -maxdepth 2 -type f | sort
rg -n --glob '!**/skill-generation/SKILL.md' "\.github/skills|\.codex/skills|agents/openai\.yaml|\.claude/skills/[^ ]" CLAUDE.md .claude .codex .github .agents/skills
```

The final `rg` command should not find stale source-of-truth references.
Legitimate references to `.claude/skills` as a folder-level symlink are okay.

## Pull Request And Git Guidance

- Do not create branches or commits unless the user asks.
- Keep commits focused when asked to commit.
- Use conventional commit style where it fits existing history, for example
 `fix(ui): preserve table filter state` or `feat(agents): add skill workflow`.
- Before summarizing work, check the relevant diff and mention validations run.
- Report unrelated pre-existing failures separately from failures caused by the
 change.

## Security And Data Handling

- Do not print secrets, tokens, certificates, or private config values.
- Treat OIDC config and cert material as sensitive unless the user explicitly
 asks to inspect them.
- Use non-interactive commands where possible. If a command prompts for a secret,
 stop and ask the user to enter it directly in their terminal.

## Known Local Pitfalls

- Always run `eslint --fix` through the package `lint-fix` script before asking
 an AI agent to reason through ESLint output by hand. Repeat if the output shows
 auto-fixable changes were applied.
- `eslint --fix` handles many issues, but empty functions often need a manual
 replacement such as `() => undefined` when appropriate.
- TypeScript declaration generation can fail when source exports leak ambient or
 private types.
- `vite-plugin-dts` settings, `entryRoot`, and externalized peers are common
 causes of package build issues.
- MUI custom theme keys should stay optional in `ThemeOptions` augmentation.
- React Router should generally be externalized from shared UI build outputs.
- Table, filter, query, route, and manager singletons often rely on generic type
 erasure patterns already present in the repo; reuse the established pattern.
