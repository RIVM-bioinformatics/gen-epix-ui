import '@mui/material';

import type { GenEpixSeqDbUiTheme } from '../models/theme';


declare module '@mui/material/styles' {
  interface Theme extends GenEpixSeqDbUiTheme { }
  // allow configuration using `createTheme()`
  interface ThemeOptions {
    'gen-epix-ui-seqdb'?: GenEpixSeqDbUiTheme['gen-epix-ui-seqdb'];
  }
}
