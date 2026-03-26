# Gen-EpiX: Genomic Epidemiology platform for disease X - Frontend UI Library - Client theme [beta]

![gen-epix-logo](../.https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/gen-epix_logo_full.svg)

Genomic Epidemiology platform for disease X

---

Gen-EpiX is platform for visualizing and analyzing genomic epidemiology data. It can be used for any disease and has very fine-grained access controls to enable collaboration between multiple organizations. It does not include, by design, bioinformatics pipelines or any other data analysis pipelines.

The platform is currently at the beta release stage and as such not yet usable for production. We are currently to get the platform released, for use in the Netherlands as the official national platform for laboratory-based surveillance of infectious diseases. Feel free to [contact us](mailto:ivo.van.walle@rivm.nl) if you are interested.

## About @gen-epix/client-theme

`@gen-epix/client-theme` is a TypeScript package that extends the [MUI (Material UI)](https://mui.com/) theme system with Gen-EpiX-specific design tokens. It provides type augmentations for `@mui/material/styles` so that custom theme properties are fully typed throughout the application.

The package adds a `gen-epix` namespace to the MUI `Theme` and `ThemeOptions` interfaces, covering the following UI areas:

- **Tree** — font, color, and dim function for phylogenetic tree visualizations
- **Line list** — font settings for tabular line list views
- **Navbar** — background, active state, and color tokens for the navigation bar
- **Footer** — background, text color, and section border color tokens

It is intended to be consumed by client applications (such as `@gen-epix/demo-client`) that create a custom MUI theme and need shared type safety for these extended properties.

## Funding

This work was funded by the European Union under the EU4Health Programme (EU4H), project ID 101113520 (NLWGSHERA2).

![cofunded-EU-logo](../.https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/cofunded_EU_logo.png)

*Disclaimer: Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or Health and Digital Executive Agency. Neither the European Union nor the granting authority can be held responsible for them.*
