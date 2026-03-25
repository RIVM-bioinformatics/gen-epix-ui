# Gen-EpiX Demo Client

![gen-epix-logo](./docs/assets/gen-epix_logo_full.svg)

## Installation

### Prerequisites

Make sure you have node and pnpm installed.

### SSL installation

Install mkcert: [docs](https://github.com/FiloSottile/mkcert)

Goto your home directory (`~`) and run:

`mkcert -install`

`mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1`

Two files have now been created in your home directory `key.pem` and `cert.pem`. Copy these two files to the cert directory of this project.

### OIDC Mock server installation (optional)

Copy `oidc-mock-server.config.example.json` to `oidc-mock-server.config.json` and make changes in `oidc-mock-server.config.json`

## Running

**Note: This front-end requires a running backend.**

Follow these steps:

1. Run the OIDC mock server (optional) (see below)
2. Run the backend server (depending on the backend run-/debug profile, this should discover the OIDC mock server if started)
3. Run the frontend (see below)

### Running the OIDC mock server

run `pnpm run oidc-mock`

### Running the Demo Client

run `pnpm start`

## Funding

This work was funded by the European Union under the EU4Health Programme (EU4H), project ID 101113520 (NLWGSHERA2).

![cofunded-EU-logo](./docs/assets/cofunded_EU_logo.png)

*Disclaimer: Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or Health and Digital Executive Agency. Neither the European Union nor the granting authority can be held responsible for them.*
