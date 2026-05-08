import '@mui/material';

import type { GenEpixCaseDbUiTheme } from '../models/theme';


declare module '@mui/material/styles' {
  interface Theme extends GenEpixCaseDbUiTheme { }
  // allow configuration using `createTheme()`
  interface ThemeOptions extends GenEpixCaseDbUiTheme { }
}
