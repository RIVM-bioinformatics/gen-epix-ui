import '@mui/material';

declare module '@mui/material/styles' {
  interface Theme {
    epi: {
      tree: {
        font: string;
        fontVariationSettings?: string;
        color: string;
        dimFn: (color: string) => string;
      };
      lineList: {
        font: string;
        fontVariationSettings?: string;
      };
    };
  }
  // allow configuration using `createTheme()`
  interface ThemeOptions {
    epi: {
      tree: {
        font: string;
        fontVariationSettings?: string;
        color: string;
        dimFn: (color: string) => string;
      };
      lineList: {
        font: string;
        fontVariationSettings?: string;
      };
    };
  }
}
