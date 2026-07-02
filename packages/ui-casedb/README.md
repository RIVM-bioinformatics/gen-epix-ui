# @gen-epix/ui-casedb [beta]

![gen-epix-logo](https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/gen-epix_logo_full.svg)

Genomic Epidemiology platform for disease X

---

Gen-EpiX is a platform for visualizing and analyzing genomic epidemiology data. It can be used for any disease and has very fine-grained access controls to enable collaboration between multiple organizations. It does not include, by design, bioinformatics pipelines or other analysis pipelines.

The platform is currently in beta and is not yet intended for production use. Feel free to [contact us](mailto:ivo.van.walle@rivm.nl) if you are interested.

## About @gen-epix/ui-casedb

`@gen-epix/ui-casedb` extends `@gen-epix/ui` with the Case DB frontend module. It exports:

- `CaseDbApp` — the root application component
- `setupCaseDb` — the bootstrapping function that registers routes, query keys, and API wiring
- Pages: case management, case sets, case types, dashboards, admin pages, …
- Widgets: line list, phylogenetic tree, epicurve, map
- Data hooks, stores, models, utilities, and theme / config types
- `CaseDbConfig` — the typed configuration interface

This package is not a standalone application. It is intended to be used from a host application that provides a Vite (or similar) build setup.

## Installation

```sh
pnpm add @gen-epix/ui @gen-epix/ui-casedb @gen-epix/api-commondb @gen-epix/api-casedb
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
  CaseDbApp,
  setupCaseDb,
} from '@gen-epix/ui-casedb';
import type { CaseDbConfig } from '@gen-epix/ui-casedb';

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
          '/locale/ui-casedb/en.json',
        ],
        code: 'en',
      },
      {
        bundles: [
          '/locale/nl.json',
          '/locale/ui/nl.json',
          '/locale/ui-casedb/nl.json',
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

  ConfigService.getInstance<CaseDbConfig>().config = {
    // add your config here
  };

  setupCaseDb();

  createRoot(document.getElementById('root')!).render(<CaseDbApp />);
};

init().catch((error) => {
  console.error('Failed to initialize the application', error);
});
```

## Funding

This work was funded by the European Union under the EU4Health Programme (EU4H), project ID 101113520 (NLWGSHERA2).

![cofunded-EU-logo](https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/cofunded_EU_logo.png)

*Disclaimer: Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or Health and Digital Executive Agency. Neither the European Union nor the granting authority can be held responsible for them.*
