import '@mui/material';

import type {
  GenEpixCaseDbUiTheme,
  GenEpixUiClientCasedbLineListTheme,
  GenEpixUiClientCasedbTreeWidgetTheme,
} from '../models/theme.models';


declare module '@mui/material/styles' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Required to augment MUI's generic interface.
  interface Components<TTheme = unknown> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    GenEpixUiClientCasedbLineList?: GenEpixUiClientCasedbLineListTheme;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    GenEpixUiClientCasedbTreeWidget?: GenEpixUiClientCasedbTreeWidgetTheme;
  }

  interface Theme extends GenEpixCaseDbUiTheme { }
  // allow configuration using `createTheme()`
  interface ThemeOptions extends GenEpixCaseDbUiTheme { }
}
