import type { GenEpixUiClientCommonTheme } from '../models/theme.models';

declare module '@mui/material/styles' {
  interface Theme extends GenEpixUiClientCommonTheme { }
  // allow configuration using `createTheme()`
  interface ThemeOptions {
    'gen-epix-ui-client-common'?: GenEpixUiClientCommonTheme['gen-epix-ui-client-common'];
    'gen-epix-ui-core-components'?: GenEpixUiClientCommonTheme['gen-epix-ui-core-components'];
  }
}
