import type { ComponentsProps } from '@mui/material/styles';

import type { SpinnerProps } from '../components/Spinner';

declare module '@mui/material/styles' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Required to augment MUI's generic interface.
  interface Components<TTheme = unknown> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    GenEpixUiCoreComponentsSpinner?: {
      defaultProps?: ComponentsProps['GenEpixUiCoreComponentsSpinner'];
    };
  }

  interface ComponentsPropsList {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    GenEpixUiCoreComponentsSpinner: SpinnerProps;
  }
}
