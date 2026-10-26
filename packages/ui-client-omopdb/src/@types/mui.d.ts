import '@mui/material';

import type { GenEpixOmopDbUiTheme } from '../models/theme.models';


declare module '@mui/material/styles' {
  interface Theme extends GenEpixOmopDbUiTheme { }
}
