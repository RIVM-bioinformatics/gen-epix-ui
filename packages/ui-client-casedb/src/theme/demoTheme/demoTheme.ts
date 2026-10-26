import { createDemoThemeOptions } from '@gen-epix/ui-client-common/theme/demoTheme';
import type {
  PaletteMode,
  Theme,
  ThemeOptions,
} from '@mui/material';
import {
  lighten,
  createTheme as muiCreateTheme,
} from '@mui/material';

export const createCaseDbDemoThemeOptions = (paletteMode: PaletteMode): ThemeOptions => {
  const commonThemeOptions = createDemoThemeOptions(paletteMode);
  const themeOptions: ThemeOptions = {
    ...commonThemeOptions,
    components: {
      ...commonThemeOptions.components,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      GenEpixUiClientCasedbLineList: {
        font: '0.8rem "Noto Sans Mono"',
      },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      GenEpixUiClientCasedbTreeWidget: {
        color: '#000',
        dimFn: (color: string) => lighten(color, 0.8),
        labelFont: '0.8rem "Noto Sans Mono"',
        scaleFont: 'bold 0.8rem "Noto Sans Mono"',
        supportLineColorLinked: '#000',
        supportLineColorUnlinked: lighten('#000', 0.75),
      },
    },
  };
  return themeOptions;
};

export const createCaseDbDemoTheme = (paletteMode: PaletteMode): Theme => {
  return muiCreateTheme(createCaseDbDemoThemeOptions(paletteMode));
};
