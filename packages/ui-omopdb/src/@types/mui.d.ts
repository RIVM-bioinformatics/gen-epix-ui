import '@mui/material';

import type { GenEpixOmopDbUiTheme } from '../models/theme';


declare module '@mui/material/styles' {
  interface Theme extends GenEpixOmopDbUiTheme { }
  // allow configuration using `createTheme()`
  interface ThemeOptions {
    'gen-epix-ui-omopdb'?: GenEpixOmopDbUiTheme['gen-epix-ui-omopdb'];
  }
}
