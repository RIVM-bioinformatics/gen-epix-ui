# Gen-EpiX: Genomic Epidemiology platform for disease X - Frontend UI Library [beta]

![gen-epix-logo](./docs/assets/gen-epix_logo_full.svg)

Genomic Epidemiology platform for disease X

---

Gen-EpiX is platform for visualizing and analyzing genomic epidemiology data. It can be used for any disease and has very fine-grained access controls to enable collaboration between multiple organizations. It does not include, by design, bioinformatics pipelines or any other data analysis pipelines.

The platform is currently at the beta release stage and as such not yet usable for production. We are currently to get the platform released, for use in the Netherlands as the official national platform for laboratory-based surveillance of infectious diseases. Feel free to [contact us](mailto:ivo.van.walle@rivm.nl) if you are interested.

## About @gen-epix/ui

This repository is a pnpm monorepo containing the frontend packages for the Gen-EpiX platform. It is structured as follows:

| Package | Description |
| --- | --- |
| [`@gen-epix/ui`](packages/ui) | The main publishable React component library. Contains all UI components, data hooks, routing, forms, state management, and API client used by Gen-EpiX applications. Built with [Vite](https://vitejs.dev/), [MUI](https://mui.com/), [TanStack Query](https://tanstack.com/query), [React Hook Form](https://react-hook-form.com/), [TipTap](https://tiptap.dev/), and [Zustand](https://zustand-demo.pmnd.rs/). |
| [`@gen-epix/client-theme`](packages/client-theme) | A publishable MUI theme type-extension package that provides shared theme augmentation typings for consumer applications. |
| [`@gen-epix/demo-theme`](packages/demo-theme) | A local theme implementation used by the demo client, based on `@gen-epix/client-theme`. |
| [`@gen-epix/demo-client`](packages/demo-client) | A Vite-based React application that serves as a development sandbox and demonstration environment for `@gen-epix/ui`. |

### Development

Install dependencies:

```sh
pnpm install
```

Start the demo client with the OIDC mock server:

```sh
pnpm start
```

Build the UI library:

```sh
pnpm --filter @gen-epix/ui run build
```

Validate (lint, type-check, tests)

```sh
pnpm run validate
```

## Funding

This work was funded by the European Union under the EU4Health Programme (EU4H), project ID 101113520 (NLWGSHERA2).

![cofunded-EU-logo](./docs/assets/cofunded_EU_logo.png)

*Disclaimer: Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or Health and Digital Executive Agency. Neither the European Union nor the granting authority can be held responsible for them.*
