import '@mui/material';

import type { GenEpixSeqDbUiTheme } from '../models/theme.models';


declare module '@mui/material/styles' {
  interface Theme extends GenEpixSeqDbUiTheme { }
  // allow configuration using `createTheme()`
  interface ThemeOptions {
    'gen-epix-ui-client-seqdb'?: GenEpixSeqDbUiTheme['gen-epix-ui-client-seqdb'];
  }
}
