import {
  createTheme,
  ThemeProvider,
} from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import i18next from 'i18next';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { render } from 'vitest-browser-react';
import type { RenderOptions } from 'vitest-browser-react';

export const renderComponent = async (
  ui: ReactNode,
  { theme = createTheme(), wrapper: Wrapper, ...options }: { theme?: Theme } & RenderOptions = {},
) => await render(ui, {
  ...options,
  wrapper: ({ children }) => (
    <I18nextProvider i18n={i18next}>
      <ThemeProvider theme={theme}>
        {Wrapper ? (
          <Wrapper>
            {children}
          </Wrapper>
        ) : children}
      </ThemeProvider>
    </I18nextProvider>
  ),
});
