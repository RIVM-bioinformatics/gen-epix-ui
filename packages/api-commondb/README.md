# @gen-epix/api-commondb [beta]

<!-- release-please: force coordinated package release -->

![gen-epix-logo](https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/gen-epix_logo_full.svg)

Genomic Epidemiology platform for disease X

---

Gen-EpiX is a platform for visualizing and analyzing genomic epidemiology data. It can be used for any disease and has very fine-grained access controls to enable collaboration between multiple organizations. It does not include, by design, bioinformatics pipelines or any other data analysis pipelines.

The platform is currently in beta and is not yet intended for production use. Feel free to [contact us](mailto:ivo.van.walle@rivm.nl) if you are interested.

## About @gen-epix/api-commondb

`@gen-epix/api-commondb` is the auto-generated TypeScript types package for the Gen-EpiX Common DB backend. It is generated from the backend OpenAPI schema and exports shared interfaces, enums, and type aliases that are used across all other Gen-EpiX API clients and UI packages.

Unlike the other `api-*` packages, `@gen-epix/api-commondb` does not expose API client classes. It is a pure types package — its exports are consumed by `@gen-epix/ui`, `@gen-epix/ui-casedb`, `@gen-epix/ui-omopdb`, `@gen-epix/ui-seqdb`, and the other `api-*` packages.

## Installation

```sh
pnpm add @gen-epix/api-commondb
```

## Regenerating the types

When the backend OpenAPI schema changes, regenerate the package with:

```sh
pnpm --filter @gen-epix/api-commondb run generate-api
```

## Funding

This work was funded by the European Union under the EU4Health Programme (EU4H), project ID 101113520 (NLWGSHERA2).

![cofunded-EU-logo](https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/cofunded_EU_logo.png)

*Disclaimer: Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or Health and Digital Executive Agency. Neither the European Union nor the granting authority can be held responsible for them.*
