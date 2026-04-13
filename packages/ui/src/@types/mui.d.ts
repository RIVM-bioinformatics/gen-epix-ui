import '@mui/material';

interface GenEpixTheme {
  'gen-epix': {
    footer: {
      background: string;
      color: string;
      sectionBorderColor: string;
    };
    lineList: {
      font: string;
      fontVariationSettings?: string;
    };
    navbar: {
      activeBackground: string;
      activeColor: string;
      background: string;
      environmentMessageColor: string;
      primaryColor: string;
      secondaryColor: string;
    };
    tree: {
      color: string;
      dimFn: (color: string) => string;
      font: string;
      fontVariationSettings?: string;
      supportLineColorLinked: string;
      supportLineColorUnlinked: string;
    };
  };
}

declare module '@mui/material/styles' {
  interface Theme extends GenEpixTheme { }
  // allow configuration using `createTheme()`
  interface ThemeOptions extends GenEpixTheme { }
}
