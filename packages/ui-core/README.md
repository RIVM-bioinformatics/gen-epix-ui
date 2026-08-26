# @gen-epix/ui-core [beta]

![gen-epix-logo](https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/gen-epix_logo_full.svg)

Genomic Epidemiology platform for disease X

---

Gen-EpiX is a platform for visualizing and analyzing genomic epidemiology data. It can be used for any disease and has very fine-grained access controls to enable collaboration between multiple organizations. It does not include, by design, bioinformatics pipelines or any other data analysis pipelines.

The platform is currently in beta and is not yet intended for production use. Feel free to [contact us](mailto:ivo.van.walle@rivm.nl) if you are interested.

## About @gen-epix/ui-core

`@gen-epix/ui-core` is the lowest-level shared building block for all Gen-EpiX frontend packages. It provides framework-agnostic primitives that are free of application-specific dependencies:

- **Classes** — `Subject`, `EventBusAbstract`, `SubscribableAbstract`
- **Services** — `DevicePixelRatioService`, `KeyboardShortcutService`, `WindowService`
- **Hooks** — `useArray`, `useDimensions`, `useScrollbarSize`, `useSubscribable`
- **Models** — generic data models, test ID types
- **Utilities** — `DataUtil`, `DownloadUtil`, `HmrUtil`, `NumberUtil`, `ObjectUtil`, `StringUtil`, `TestIdUtil`, `ValidationUtil`

This package is a dependency of `@gen-epix/ui` and other Gen-EpiX packages. It has no dependency on MUI, React Router, TanStack Query, or any other application-level library.

## Installation

```sh
pnpm add @gen-epix/ui-core
```

Refer to `package.json` for the full list of peer dependencies that your host application must also install.

## Usage

Each export is available as a deep import using its own subpath, for example:

```ts
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';
import { DataUtil } from '@gen-epix/ui-core/utils/DataUtil';
import { useSubscribable } from '@gen-epix/ui-core/hooks/useSubscribable';
```

### WindowService

`WindowService` provides a testable wrapper around the browser `window` object.

```ts
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';

const preferredLanguage = WindowService.getInstance().window.localStorage.getItem('preferred-language');
```

## Funding

This work was funded by the European Union under the EU4Health Programme (EU4H), project ID 101113520 (NLWGSHERA2).

![cofunded-EU-logo](https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/cofunded_EU_logo.png)

*Disclaimer: Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or Health and Digital Executive Agency. Neither the European Union nor the granting authority can be held responsible for them.*
