import '@mui/material';

import type { GenEpixSeqDbUiTheme } from '../models/theme.models';


declare module '@mui/material/styles' {
  interface Theme extends GenEpixSeqDbUiTheme { }
  // allow configuration using `createTheme()`
  interface ThemeOptions extends GenEpixSeqDbUiTheme { }
}
