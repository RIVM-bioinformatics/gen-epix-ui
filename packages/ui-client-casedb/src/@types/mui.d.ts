import '@mui/material';

import type {
  GenEpixCaseDbUiTheme,
  GenEpixUiClientCasedbLineListTheme,
} from '../models/theme.models';


declare module '@mui/material/styles' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Required to augment MUI's generic interface.
  interface Components<TTheme = unknown> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    GenEpixUiClientCasedbLineList?: GenEpixUiClientCasedbLineListTheme;
  }

  interface Theme extends GenEpixCaseDbUiTheme { }
}
