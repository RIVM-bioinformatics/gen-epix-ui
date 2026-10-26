import '@mui/material';

import type { GenEpixSeqDbUiTheme } from '../models/theme.models';


declare module '@mui/material/styles' {
  interface Theme extends GenEpixSeqDbUiTheme { }
}
