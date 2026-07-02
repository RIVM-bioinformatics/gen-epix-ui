# @gen-epix/ui [beta]

![gen-epix-logo](https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/gen-epix_logo_full.svg)

Genomic Epidemiology platform for disease X

---

Gen-EpiX is a platform for visualizing and analyzing genomic epidemiology data. It can be used for any disease and has very fine-grained access controls to enable collaboration between multiple organizations. It does not include, by design, bioinformatics pipelines or any other data analysis pipelines.

The platform is currently in beta and is not yet intended for production use. Feel free to [contact us](mailto:ivo.van.walle@rivm.nl) if you are interested.

## About @gen-epix/ui

`@gen-epix/ui` is the core React component library shared by all Gen-EpiX frontend applications. It provides:

- UI components (application bar, sidebar, breadcrumbs, tables, forms, notifications, dialogs, …)
- Application services (`ConfigService`, `RouterService`, `AuthenticationService`, `AuthorizationService`, `I18nService`, `NotificationService`, …)
- Data hooks built on [TanStack Query](https://tanstack.com/query)
- Form primitives built on [React Hook Form](https://react-hook-form.com/)
- Rich-text editing via [TipTap](https://tiptap.dev/)
- Global state via [Zustand](https://zustand-demo.pmnd.rs/)
- The `App` root component and the `setup` bootstrapping function

This package is not a standalone application. It is the foundation used by the domain-specific packages (`@gen-epix/ui-casedb`, `@gen-epix/ui-omopdb`, `@gen-epix/ui-seqdb`), each of which adds their own routes, pages, and API wiring on top.

## Installation

```sh
pnpm add @gen-epix/ui
```

Refer to `package.json` for the full list of peer dependencies that your host application must also install.

## Usage

The example below shows the minimal bootstrap for a host application that uses `@gen-epix/ui` directly (without a domain package on top). Domain-specific packages like `@gen-epix/ui-casedb` wrap this pattern — see their READMEs for the recommended usage.

```tsx
import { createRoot } from 'react-dom/client';
import {
  App,
  ConfigService,
  I18nService,
  WindowService,
  setup,
} from '@gen-epix/ui';

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
      { bundles: ['/locale/en.json'], code: 'en' },
      { bundles: ['/locale/nl.json'], code: 'nl' },
    ],
    setNewLanguageCode: async (code: string) => {
      return Promise.resolve(
        WindowService.getInstance().window.localStorage.setItem(LOCAL_STORAGE_KEY_PREFERRED_LANGUAGE, code),
      );
    },
  });

  ConfigService.getInstance().config = {
    // add your config here
  };

  setup();

  createRoot(document.getElementById('root')!).render(<App />);
};

init().catch((error) => {
  console.error('Failed to initialize the application', error);
});
```

## Funding

This work was funded by the European Union under the EU4Health Programme (EU4H), project ID 101113520 (NLWGSHERA2).

![cofunded-EU-logo](https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/cofunded_EU_logo.png)

*Disclaimer: Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or Health and Digital Executive Agency. Neither the European Union nor the granting authority can be held responsible for them.*
