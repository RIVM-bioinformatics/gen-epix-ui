# Gen-EpiX: Genomic Epidemiology platform for disease X - Frontend UI Library [beta]

![gen-epix-logo](./docs/assets/gen-epix_logo_full.svg)

Genomic Epidemiology platform for disease X

---

Gen-EpiX is platform for visualizing and analyzing genomic epidemiology data. It can be used for any disease and has very fine-grained access controls to enable collaboration between multiple organizations. It does not include, by design, bioinformatics pipelines or any other data analysis pipelines.

The platform is currently at the beta release stage and as such not yet usable for production. We are currently to get the platform released, for use in the Netherlands as the official national platform for laboratory-based surveillance of infectious diseases. Feel free to [contact us](mailto:ivo.van.walle@rivm.nl) if you are interested.

## About @gen-epix/ui

The project exports a library of frontend components and an (almost) ready to use application. You will need to create your own project and include `@gen-epix/ui` as a dependency. Please refer to the [demo client project](https://github.com/RIVM-bioinformatics/gen-epix-ui-demo-client) to see a working example of this library.

Basic example:

```tsx
import { createRoot } from 'react-dom/client';

import {
  App,
  ConfigManager,
  I18nManager,
  setup,
} from '@gen-epix/ui';

ConfigManager.instance.config = {
  // add your config
}

// initialize the I18nManager
I18nManager.instance.init()
  .then(() => {
    // call setup
    setup();

    // run the app
    createRoot(document.getElementById('root')).render(
      <App />,
    );
  })
  .catch(() => {
    alert('Failed to initialize the application');
  });
```

## Funding

This work was funded by the European Union under the EU4Health Programme (EU4H), project ID 101113520 (NLWGSHERA2).

![cofunded-EU-logo](./docs/assets/cofunded_EU_logo.png)

*Disclaimer: Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or Health and Digital Executive Agency. Neither the European Union nor the granting authority can be held responsible for them.*
