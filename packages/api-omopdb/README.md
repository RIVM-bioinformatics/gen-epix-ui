# Gen-EpiX: Genomic Epidemiology platform for disease X - Case DB API client [beta]

![gen-epix-logo](https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/gen-epix_logo_full.svg)

Genomic Epidemiology platform for disease X

---

Gen-EpiX is platform for visualizing and analyzing genomic epidemiology data. It can be used for any disease and has very fine-grained access controls to enable collaboration between multiple organizations. It does not include, by design, bioinformatics pipelines or any other data analysis pipelines.

The platform is currently at the beta release stage and as such not yet usable for production. We are currently to get the platform released, for use in the Netherlands as the official national platform for laboratory-based surveillance of infectious diseases. Feel free to [contact us](mailto:ivo.van.walle@rivm.nl) if you are interested.

## About @gen-epix/api-casedb

`@gen-epix/api-casedb` is the publishable TypeScript client for the Gen-EpiX Case DB backend. The package is generated from the backend OpenAPI schema and exports typed API classes, request and response models, and shared request utilities for frontend consumers.

The package currently exposes these top-level API groups:

- `AbacApi`
- `AuthApi`
- `CaseApi`
- `DefaultApi`
- `GeoApi`
- `OntologyApi`
- `OrganizationApi`
- `SystemApi`

It is consumed by `@gen-epix/ui`, but it can also be used independently in other applications that need direct access to the Case DB endpoints.

Install the package with its peer dependency:

```sh
pnpm add @gen-epix/api-casedb axios
```

Basic setup:

```ts
import { BaseAPI, CaseApi } from '@gen-epix/api-casedb';

BaseAPI.baseUrl = 'https://example.invalid/api';
BaseAPI.defaultRequestTimeout = 10000;
BaseAPI.onRequest = [
 (request) => {
  request.headers.set('Authorization', 'Bearer <token>');
  return request;
 },
];

const caseApi = CaseApi.instance;
```

The generated source files live under `src`. When the backend OpenAPI schema changes, regenerate the client with:

```sh
pnpm --filter @gen-epix/api-casedb run generate-api
```

Build the published package with:

```sh
pnpm --filter @gen-epix/api-casedb run build
```

## Funding

This work was funded by the European Union under the EU4Health Programme (EU4H), project ID 101113520 (NLWGSHERA2).

![cofunded-EU-logo](https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/cofunded_EU_logo.png)

*Disclaimer: Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or Health and Digital Executive Agency. Neither the European Union nor the granting authority can be held responsible for them.*
