import type { ComponentsProps } from '@mui/material/styles';

import type {
  PhylogeneticTreeComponentTheme,
  PhylogeneticTreeProps,
} from '../components/PhylogeneticTree';
import type { GenEpixUiPhylogeneticTreeTheme } from '../models/theme.models';

declare module '@mui/material/styles' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Required to augment MUI's generic interface.
  interface Components<TTheme = unknown> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    GenEpixUiPhylogeneticTree?: {
      defaultProps?: ComponentsProps['GenEpixUiPhylogeneticTree'];
    } & PhylogeneticTreeComponentTheme;
  }

  interface ComponentsPropsList {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    GenEpixUiPhylogeneticTree: PhylogeneticTreeProps;
  }

  interface Theme extends GenEpixUiPhylogeneticTreeTheme { }
}
