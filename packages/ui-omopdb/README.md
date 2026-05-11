# @gen-epix/ui-omopdb [beta]

![gen-epix-logo](https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/gen-epix_logo_full.svg)

Genomic Epidemiology platform for disease X

---

Gen-EpiX is a platform for visualizing and analyzing genomic epidemiology data. It can be used for any disease and has fine-grained access controls to enable collaboration between multiple organizations. It does not include, by design, bioinformatics pipelines or other analysis pipelines.

The platform is currently in beta and is not yet intended for production use. Feel free to [contact us](mailto:ivo.van.walle@rivm.nl) if you are interested.

## About @gen-epix/ui-omopdb

`@gen-epix/ui-omopdb` extends `@gen-epix/ui` with the OMOPDB frontend module. It exports OMOPDB-specific setup and route composition, together with the package's `HomePage`, query keys, and theme and config models.

This package is not a standalone application. It is intended to be composed into a host app that already uses `@gen-epix/ui`.

## Installation

Install the shared UI package, the OMOPDB UI package, the matching API clients, and the peer dependencies listed in `package.json`.

```sh
pnpm add @gen-epix/ui @gen-epix/ui-omopdb @gen-epix/api-commondb @gen-epix/api-omopdb
```

## Usage

```tsx
import { createRoot } from 'react-dom/client';

import { App, ConfigManager, I18nManager } from '@gen-epix/ui';
import { setupOmopDb } from '@gen-epix/ui-omopdb';

ConfigManager.getInstance().config = {
  // add your config
};

I18nManager.getInstance().init()
  .then(() => {
    setupOmopDb();

    createRoot(document.getElementById('root')!).render(<App />);
  })
  .catch(() => {
    alert('Failed to initialize the application');
  });
```

## Funding

This work was funded by the European Union under the EU4Health Programme (EU4H), project ID 101113520 (NLWGSHERA2).

![cofunded-EU-logo](https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/cofunded_EU_logo.png)

*Disclaimer: Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or Health and Digital Executive Agency. Neither the European Union nor the granting authority can be held responsible for them.*
