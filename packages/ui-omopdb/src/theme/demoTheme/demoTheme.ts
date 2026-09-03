import { createDemoThemeOptions } from '@gen-epix/ui-client-common/theme/demoTheme';
import type {
  PaletteMode,
  Theme,
  ThemeOptions,
} from '@mui/material';
import { createTheme as muiCreateTheme } from '@mui/material';

export const createOmopDbDemoThemeOptions = (paletteMode: PaletteMode): ThemeOptions => {
  const themeOptions: ThemeOptions = {
    ...createDemoThemeOptions(paletteMode),
    'gen-epix-ui-omopdb': {
    },
  };

  return muiCreateTheme(themeOptions);
};

export const createOmopDbDemoTheme = (paletteMode: PaletteMode): Theme => {
  return muiCreateTheme(createOmopDbDemoThemeOptions(paletteMode));
};
