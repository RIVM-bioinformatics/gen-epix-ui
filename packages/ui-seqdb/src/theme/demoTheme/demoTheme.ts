import { createDemoThemeOptions } from '@gen-epix/ui';
import type {
  PaletteMode,
  Theme,
  ThemeOptions,
} from '@mui/material';
import { createTheme as muiCreateTheme } from '@mui/material';

export const createSeqDbDemoThemeOptions = (paletteMode: PaletteMode): ThemeOptions => {
  const themeOptions: ThemeOptions = {
    ...createDemoThemeOptions(paletteMode),
    'gen-epix-ui-seqdb': {
    },
  };

  return themeOptions;
};
export const createSeqDbDemoTheme = (paletteMode: PaletteMode): Theme => {
  return muiCreateTheme(createSeqDbDemoThemeOptions(paletteMode));
};
