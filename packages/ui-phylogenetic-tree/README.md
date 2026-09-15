# @gen-epix/ui-phylogenetic-tree [beta]

![gen-epix-logo](https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/gen-epix_logo_full.svg)

Genomic Epidemiology platform for disease X

---

Gen-EpiX is a platform for visualizing and analyzing genomic epidemiology data. It can be used for any disease and has very fine-grained access controls to enable collaboration between multiple organizations. It does not include, by design, bioinformatics pipelines or any other data analysis pipelines.

The platform is currently in beta and is not yet intended for production use. Feel free to [contact us](mailto:ivo.van.walle@rivm.nl) if you are interested.

## About @gen-epix/ui-phylogenetic-tree

`@gen-epix/ui-phylogenetic-tree` is a standalone React package that provides a phylogenetic tree visualization component for the Gen-EpiX platform. It has no dependency on the full `@gen-epix/ui-client-common` application framework.

- **Components** — `PhylogeneticTree` — an interactive, canvas-rendered phylogenetic tree viewer
- **Models** — tree data types and interfaces (`tree`)
- **Utilities** — `NewickUtil` for parsing and serializing [Newick format](https://en.wikipedia.org/wiki/Newick_format), `TreeUtil` for tree traversal and manipulation

Peer dependencies are kept minimal: `@gen-epix/ui-core`, `@mui/material`, and `react`.

## Installation

```sh
pnpm add @gen-epix/ui-phylogenetic-tree
```

Refer to `package.json` for the full list of peer dependencies that your host application must also install.

## Usage

```tsx
import { PhylogeneticTree } from '@gen-epix/ui-phylogenetic-tree/components/PhylogeneticTree';
import { NewickUtil } from '@gen-epix/ui-phylogenetic-tree/utils/NewickUtil';

const newick = '((A:0.1,B:0.2):0.3,C:0.4);';
const tree = NewickUtil.parse(newick);

function MyPage() {
  return <PhylogeneticTree tree={tree} />;
}
```

## Funding

This work was funded by the European Union under the EU4Health Programme (EU4H), project ID 101113520 (NLWGSHERA2).

![cofunded-EU-logo](https://github.com/RIVM-bioinformatics/gen-epix/raw/main/docs/assets/cofunded_EU_logo.png)

*Disclaimer: Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or Health and Digital Executive Agency. Neither the European Union nor the granting authority can be held responsible for them.*
