import { createDemoTheme } from '@gen-epix/ui';
import type {
  PaletteMode,
  Theme,
  ThemeOptions,
} from '@mui/material';
import {
  lighten,
  createTheme as muiCreateTheme,
} from '@mui/material';

export const createCaseDbDemoTheme = (paletteMode: PaletteMode): Theme => {
  const themeOptions: ThemeOptions = {
    ...createDemoTheme(paletteMode),
    'gen-epix-ui-casedb': {
      lineList: {
        font: '0.8rem "Noto Sans Mono"',
      },
      tree: {
        color: '#000',
        dimFn: (color: string) => lighten(color, 0.8),
        font: 'bold 0.7rem "Noto Sans Mono"',
        supportLineColorLinked: '#000',
        supportLineColorUnlinked: lighten('#000', 0.75),
      },
    },
  };

  return muiCreateTheme(themeOptions);
};
