import { createDemoThemeOptions } from '@gen-epix/ui-client-common/theme/demoTheme';
import type {
  PaletteMode,
  Theme,
  ThemeOptions,
} from '@mui/material';
import { createTheme as muiCreateTheme } from '@mui/material';

export const createSeqDbDemoThemeOptions = (paletteMode: PaletteMode): ThemeOptions => {
  const themeOptions: ThemeOptions = {
    ...createDemoThemeOptions(paletteMode),
    'gen-epix-ui-client-seqdb': {
    },
  };

  return themeOptions;
};
export const createSeqDbDemoTheme = (paletteMode: PaletteMode): Theme => {
  return muiCreateTheme(createSeqDbDemoThemeOptions(paletteMode));
};
