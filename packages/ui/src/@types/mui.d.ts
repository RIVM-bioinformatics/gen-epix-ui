import '@mui/material';

import type { GenEpixUiTheme } from '../models/theme';


declare module '@mui/material/styles' {
  interface Theme extends GenEpixUiTheme { }
  // allow configuration using `createTheme()`
  interface ThemeOptions extends GenEpixUiTheme { }
}
