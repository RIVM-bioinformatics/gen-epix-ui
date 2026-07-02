# @gen-epix/api-seqdb [beta]

![gen-epix-logo](https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/gen-epix_logo_full.svg)

Genomic Epidemiology platform for disease X

---

Gen-EpiX is a platform for visualizing and analyzing genomic epidemiology data. It can be used for any disease and has very fine-grained access controls to enable collaboration between multiple organizations. It does not include, by design, bioinformatics pipelines or any other data analysis pipelines.

The platform is currently in beta and is not yet intended for production use. Feel free to [contact us](mailto:ivo.van.walle@rivm.nl) if you are interested.

## About @gen-epix/api-seqdb

`@gen-epix/api-seqdb` is the auto-generated TypeScript client for the Gen-EpiX Sequence DB backend. It is generated from the backend OpenAPI schema and exports typed API classes, request/response models, and shared request utilities.

The package exposes the following top-level API groups:

- `SeqDbAbacApi`
- `SeqDbAuthApi`
- `SeqDbDefaultApi`
- `SeqDbFileApi`
- `SeqDbOrganizationApi`
- `SeqDbSeqApi`
- `SeqDbSystemApi`

It is consumed by `@gen-epix/ui-seqdb`, but can also be used independently in any application that needs direct access to the Sequence DB endpoints.

## Installation

```sh
pnpm add @gen-epix/api-seqdb axios
```

## Usage

```ts
import { SeqDbBaseAPI, SeqDbSeqApi } from '@gen-epix/api-seqdb';

SeqDbBaseAPI.baseUrl = 'https://your-seqdb-api/api';
SeqDbBaseAPI.defaultRequestTimeout = 10_000;
SeqDbBaseAPI.onRequest = [
  (request) => {
    request.headers.set('Authorization', 'Bearer <token>');
    return request;
  },
];

const sequences = await SeqDbSeqApi.getInstance().getSequences();
```

## Regenerating the client

When the backend OpenAPI schema changes, regenerate the client with:

```sh
pnpm --filter @gen-epix/api-seqdb run generate-api
```

## Funding

This work was funded by the European Union under the EU4Health Programme (EU4H), project ID 101113520 (NLWGSHERA2).

![cofunded-EU-logo](https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/cofunded_EU_logo.png)

*Disclaimer: Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or Health and Digital Executive Agency. Neither the European Union nor the granting authority can be held responsible for them.*
