import type { GenEpixCoreComponentsTheme } from '../models/theme.models';

declare module '@mui/material/styles' {
  interface Theme extends GenEpixCoreComponentsTheme { }
  // allow configuration using `createTheme()`
  interface ThemeOptions {
    'gen-epix-ui-core-components'?: GenEpixCoreComponentsTheme['gen-epix-ui-core-components'];
  }
}
