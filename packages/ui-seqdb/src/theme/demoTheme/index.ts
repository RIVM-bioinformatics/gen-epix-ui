import { createDemoTheme } from '@gen-epix/ui';
import type {
  PaletteMode,
  Theme,
  ThemeOptions,
} from '@mui/material';
import { createTheme as muiCreateTheme } from '@mui/material';

export const createSeqDbDemoTheme = (paletteMode: PaletteMode): Theme => {
  const themeOptions: ThemeOptions = {
    ...createDemoTheme(paletteMode),
    'gen-epix-ui-seqdb': {
    },
  };

  return muiCreateTheme(themeOptions);
};
