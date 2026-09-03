# Gen-EpiX: Genomic Epidemiology platform for disease X - Frontend UI Library [beta]

![gen-epix-logo](https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/gen-epix_logo_full.svg)

Genomic Epidemiology platform for disease X

---

Gen-EpiX is a platform for visualizing and analyzing genomic epidemiology data. It can be used for any disease and has very fine-grained access controls to enable collaboration between multiple organizations. It does not include, by design, bioinformatics pipelines or any other data analysis pipelines.

The platform is currently at the beta release stage and as such not yet usable for production. We are working towards a release for use in the Netherlands as the official national platform for laboratory-based surveillance of infectious diseases. Feel free to [contact us](mailto:ivo.van.walle@rivm.nl) if you are interested.

## About this repository

This repository is a pnpm monorepo managed with [Lerna](https://lerna.js.org/). It contains all frontend packages for the Gen-EpiX platform, organized under two directories:

- **`packages/`** — publishable libraries
- **`examples/`** — development sandboxes / demo applications

### Publishable packages

#### UI component libraries

| Package | Description |
| --- | --- |
| [`@gen-epix/ui-core`](packages/ui-core) | Low-level, framework-agnostic primitives shared by all Gen-EpiX packages: event bus abstractions, `WindowService`, `KeyboardShortcutService`, generic hooks, and utility classes. No dependency on MUI or any application-level library. |
| [`@gen-epix/ui-client-common`](packages/ui-client-common) | The core React component library shared across all Gen-EpiX applications. Contains UI components, data hooks, routing, forms, services, and state management. Built with [Vite](https://vitejs.dev/), [MUI](https://mui.com/), [TanStack Query](https://tanstack.com/query), [React Hook Form](https://react-hook-form.com/), [TipTap](https://tiptap.dev/), and [Zustand](https://zustand-demo.pmnd.rs/). Depends on `@gen-epix/ui-core`. |
| [`@gen-epix/ui-phylogenetic-tree`](packages/ui-phylogenetic-tree) | Standalone phylogenetic tree visualization component (`PhylogeneticTree`), Newick parser (`NewickUtil`), and tree utilities (`TreeUtil`). Depends only on `@gen-epix/ui-core`, MUI, and React. |
| [`@gen-epix/ui-casedb`](packages/ui-casedb) | Disease case management UI built on top of `@gen-epix/ui-client-common`. Provides the epidemiology dashboard, line list, phylogenetic tree, curve, and map widgets, as well as case/case-set/case-type admin pages. |
| [`@gen-epix/ui-omopdb`](packages/ui-omopdb) | OMOP DB-specific UI components and pages built on top of `@gen-epix/ui-client-common`. |
| [`@gen-epix/ui-seqdb`](packages/ui-seqdb) | Sequence DB-specific UI components and pages built on top of `@gen-epix/ui-client-common`. |

#### API clients (auto-generated from OpenAPI schemas)

| Package | Description |
| --- | --- |
| [`@gen-epix/api-casedb`](packages/api-casedb) | Typed API client for the Gen-EpiX Case DB backend. |
| [`@gen-epix/api-commondb`](packages/api-commondb) | Typed API client for the Gen-EpiX Common DB backend (shared by all domain UIs). |
| [`@gen-epix/api-omopdb`](packages/api-omopdb) | Typed API client for the Gen-EpiX OMOP DB backend. |
| [`@gen-epix/api-seqdb`](packages/api-seqdb) | Typed API client for the Gen-EpiX Sequence DB backend. |

### Example applications

| Package | Description |
| --- | --- |
| [`@gen-epix/demo-client-casedb`](examples/demo-client-casedb) | Vite-based React app that demonstrates `@gen-epix/ui-casedb`. Includes an OIDC mock server for local development. |
| [`@gen-epix/demo-client-omopdb`](examples/demo-client-omopdb) | Vite-based React app that demonstrates `@gen-epix/ui-omopdb`. Includes an OIDC mock server for local development. |
| [`@gen-epix/demo-client-seqdb`](examples/demo-client-seqdb) | Vite-based React app that demonstrates `@gen-epix/ui-seqdb`. Includes an OIDC mock server for local development. |

### Development

Install dependencies:

```sh
pnpm install
```

Copy the OIDC mock server config and adjust as needed:

```sh
cp oidc-mock-server.config.example.json oidc-mock-server.config.json
```

Start a demo client with its OIDC mock server:

```sh
pnpm start          # Case DB demo
pnpm start-omop     # OMOP DB demo
pnpm start-seq      # Sequence DB demo
```

Build all publishable packages:

```sh
pnpm run build
```

Validate (lint, type-check, tests) across all packages:

```sh
pnpm run validate
```

Install Playwright browsers for browser-oriented tests from a package that declares
Playwright, such as `@gen-epix/ui-client-common`:

```sh
pnpm --filter @gen-epix/ui-client-common exec playwright install
```

Running `pnpm exec playwright install` from the monorepo root fails because the
root package does not declare a Playwright dependency, so pnpm cannot expose the
`playwright` binary there.

Regenerate API clients from their OpenAPI schemas:

```sh
pnpm run generate-api
```

Add missing i18n translation placeholders:

```sh
pnpm run add-missing-translations
```

## Funding

This work was funded by the European Union under the EU4Health Programme (EU4H), project ID 101113520 (NLWGSHERA2).

![cofunded-EU-logo](https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/cofunded_EU_logo.png)

*Disclaimer: Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or Health and Digital Executive Agency. Neither the European Union nor the granting authority can be held responsible for them.*
