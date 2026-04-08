import '@mui/material';

interface GenEpixTheme {
  'gen-epix': {
    tree: {
      font: string;
      fontVariationSettings?: string;
      color: string;
      supportLineColorLinked: string;
      supportLineColorUnlinked: string;
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
  interface Theme extends GenEpixTheme { }
  // allow configuration using `createTheme()`
  interface ThemeOptions extends GenEpixTheme { }
}
