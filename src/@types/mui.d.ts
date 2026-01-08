import '@mui/material';

interface ThemeGenEpix {
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
    navbar: {
      background: string;
      activeBackground: string;
      activeColor: string;
      primaryColor: string;
      secondaryColor: string;
      environmentMessageColor: string;
    };
    footer: {
      background: string;
      color: string;
      sectionBorderColor: string;
    };
  };
}

declare module '@mui/material/styles' {
  interface Theme extends ThemeGenEpix { }
  // allow configuration using `createTheme()`
  interface ThemeOptions extends ThemeGenEpix { }
}
