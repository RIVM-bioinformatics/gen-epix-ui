import type {
  GenEpixUiClientCommonFooterTheme,
  GenEpixUiClientCommonNavbarTheme,
  GenEpixUiClientCommonTheme,
} from '../models/theme.models';

declare module '@mui/material/styles' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Required to augment MUI's generic interface.
  interface Components<TTheme = unknown> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    GenEpixUiClientCommonFooter?: GenEpixUiClientCommonFooterTheme;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    GenEpixUiClientCommonNavbar?: GenEpixUiClientCommonNavbarTheme;
  }

  interface Theme extends GenEpixUiClientCommonTheme { }
  // allow configuration using `createTheme()`
  interface ThemeOptions extends GenEpixUiClientCommonTheme { }
}
