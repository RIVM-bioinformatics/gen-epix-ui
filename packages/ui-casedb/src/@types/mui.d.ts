import '@mui/material';

import type { GenEpixCaseDbUiTheme } from '../models/theme';


declare module '@mui/material/styles' {
  interface Theme extends GenEpixCaseDbUiTheme { }
  // allow configuration using `createTheme()`
  interface ThemeOptions {
    'gen-epix-ui-casedb'?: GenEpixCaseDbUiTheme['gen-epix-ui-casedb'];
  }
}
