<p align="center">
    <img src="https://raw.githubusercontent.com/RIVM-bioinformatics/gen-epix-ui-demo-client/refs/heads/main/src/assets/logo/gen-epix-logo-large.svg" alt="gen-epix-api-logo">
</p>
<p align="center">
    <em>Genomic Epidemiology platform for disease X</em>
</p>

---

# Gen-EpiX: Genomic Epidemiology platform for disease X - Frontend UI Library<br>[beta]

Gen-EpiX is platform for visualizing and analyzing genomic epidemiology data. It can be used for any disease and has very fine-grained access controls to enable collaboration between multiple organizations. It does not include, by design, bioinformatics pipelines or any other data analysis pipelines.

The platform is currently at the beta release stage and as such not yet usable for production. We are currently to get the platform released, for use in the Netherlands as the official national platform for laboratory-based surveillance of infectious diseases. Feel free to contact us <a href="mailto:ivo.van.walle@rivm.nl">here</a> if you are interested.

## About @gen-epix/ui

The project exports a library of frontend components and an (almost) ready to use application. You will need to create your own project and include `@gen-epix/ui` as a dependency. Please refer to the <a href="https://github.com/RIVM-bioinformatics/gen-epix-ui-demo-client">demo client project</a> to see a working example of this library.

Basic example:

```tsx
import { createRoot } from 'react-dom/client';

import {
  App,
  ConfigManager,
  setup,
} from '@gen-epix/ui';

// call setup before anything else
setup();

ConfigManager.instance.config = {
  // add your config
}
createRoot(document.getElementById('root')).render(<App />);
```
