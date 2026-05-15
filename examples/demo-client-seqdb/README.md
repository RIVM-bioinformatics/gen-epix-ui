# Gen-EpiX: Genomic Epidemiology platform for disease X - Frontend UI Library - Demo client [beta]

![gen-epix-logo](../.https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/gen-epix_logo_full.svg)

Genomic Epidemiology platform for disease X

---

Gen-EpiX is platform for visualizing and analyzing genomic epidemiology data. It can be used for any disease and has very fine-grained access controls to enable collaboration between multiple organizations. It does not include, by design, bioinformatics pipelines or any other data analysis pipelines.

The platform is currently at the beta release stage and as such not yet usable for production. We are currently to get the platform released, for use in the Netherlands as the official national platform for laboratory-based surveillance of infectious diseases. Feel free to [contact us](mailto:ivo.van.walle@rivm.nl) if you are interested.

## About @gen-epix/demo-client

`@gen-epix/demo-client` is a reference client application for the Gen-EpiX platform, built with [React](https://react.dev/), [Vite](https://vitejs.dev/), and [MUI (Material UI)](https://mui.com/). It demonstrates how to integrate and use the `@gen-epix/ui` component library within a real application.

Key characteristics:

- **Authentication** — integrates with an OIDC provider; an optional local OIDC mock server is included for development
- **Theming** — uses `@gen-epix/demo-theme` and MUI's `createTheme` to apply a custom Gen-EpiX visual theme
- **Internationalisation** — powered by [i18next](https://www.i18next.com/) with English and Dutch locale files; includes tooling to detect missing or stale translations
- **Routing** — uses [React Router](https://reactrouter.com/) for client-side navigation
- **Development server** — served over HTTPS via Vite with local SSL certificates (mkcert)

This package is not intended for production deployment. Its purpose is to showcase platform capabilities and serve as a starting point for building a production client on top of `@gen-epix/ui`.

## Installation

### Prerequisites

Make sure you have node and pnpm installed.

### SSL installation

Install mkcert: [docs](https://github.com/FiloSottile/mkcert)

Goto your home directory (`~`) and run:

`mkcert -install`

`mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1`

Two files have now been created in your home directory `key.pem` and `cert.pem`. Copy these two files to the cert directory of this project (root directory).

### OIDC Mock server installation (optional)

Copy `oidc-mock-server.config.example.json` to `oidc-mock-server.config.json` (in the root of this repository) and make changes in `oidc-mock-server.config.json`

## Running

**Note: This front-end requires a running backend.**

run `pnpm start`

## Funding

This work was funded by the European Union under the EU4Health Programme (EU4H), project ID 101113520 (NLWGSHERA2).

![cofunded-EU-logo](https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/cofunded_EU_logo.png)

*Disclaimer: Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or Health and Digital Executive Agency. Neither the European Union nor the granting authority can be held responsible for them.*
