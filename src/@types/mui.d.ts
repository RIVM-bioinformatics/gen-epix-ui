import '@mui/material';

declare module '@mui/material/styles' {
  interface Theme {
    'gen-epix': {
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
    'gen-epix': {
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
