# @gen-epix/ui-omopdb [beta]

![gen-epix-logo](https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/gen-epix_logo_full.svg)

Genomic Epidemiology platform for disease X

---

Gen-EpiX is a platform for visualizing and analyzing genomic epidemiology data. It can be used for any disease and has very fine-grained access controls to enable collaboration between multiple organizations. It does not include, by design, bioinformatics pipelines or other analysis pipelines.

The platform is currently in beta and is not yet intended for production use. Feel free to [contact us](mailto:ivo.van.walle@rivm.nl) if you are interested.

## About @gen-epix/ui-omopdb

`@gen-epix/ui-omopdb` extends `@gen-epix/ui` with the OMOP DB frontend module. It exports:

- `OmopDbApp` — the root application component
- `setupOmopDb` — the bootstrapping function that registers routes, query keys, and API wiring
- Pages and components specific to the OMOP DB domain
- Data hooks, models, utilities, and theme / config types
- `OmopDbConfig` — the typed configuration interface

This package is not a standalone application. It is intended to be used from a host application that provides a Vite (or similar) build setup.

## Installation

```sh
pnpm add @gen-epix/ui @gen-epix/ui-omopdb @gen-epix/api-commondb @gen-epix/api-omopdb
```

Refer to `package.json` for the full list of peer dependencies.

## Usage

```tsx
import { createRoot } from 'react-dom/client';
import {
  ConfigService,
  I18nService,
  WindowService,
} from '@gen-epix/ui';
import {
  OmopDbApp,
  setupOmopDb,
} from '@gen-epix/ui-omopdb';
import type { OmopDbConfig } from '@gen-epix/ui-omopdb';

const LOCAL_STORAGE_KEY_PREFERRED_LANGUAGE = 'GenEpix-preferred-language';

const init = async () => {
  await I18nService.getInstance().init({
    getCurrentLanguageCode: async () => {
      return Promise.resolve(
        WindowService.getInstance().window.localStorage.getItem(LOCAL_STORAGE_KEY_PREFERRED_LANGUAGE)
          ?? window.navigator.language.split('-')[0]
          ?? 'en',
      );
    },
    languageConfigs: [
      {
        bundles: [
          '/locale/en.json',
          '/locale/ui/en.json',
          '/locale/ui-omopdb/en.json',
        ],
        code: 'en',
      },
      {
        bundles: [
          '/locale/nl.json',
          '/locale/ui/nl.json',
          '/locale/ui-omopdb/nl.json',
        ],
        code: 'nl',
      },
    ],
    setNewLanguageCode: async (code: string) => {
      return Promise.resolve(
        WindowService.getInstance().window.localStorage.setItem(LOCAL_STORAGE_KEY_PREFERRED_LANGUAGE, code),
      );
    },
  });

  ConfigService.getInstance<OmopDbConfig>().config = {
    // add your config here
  };

  setupOmopDb();

  createRoot(document.getElementById('root')!).render(<OmopDbApp />);
};

init().catch((error) => {
  console.error('Failed to initialize the application', error);
});
```

## Funding

This work was funded by the European Union under the EU4Health Programme (EU4H), project ID 101113520 (NLWGSHERA2).

![cofunded-EU-logo](https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/cofunded_EU_logo.png)

*Disclaimer: Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or Health and Digital Executive Agency. Neither the European Union nor the granting authority can be held responsible for them.*
