import { container as rootContainer } from 'tsyringe';
import { render } from 'vitest-browser-react';
import { CacheProvider } from '@emotion/react';
import { QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import {
  CssBaseline,
  ThemeProvider,
} from '@mui/material';

import { EmotionCacheService } from '../../classes/services/EmotionCacheService';
import { QueryClientService } from '../../classes/services/QueryClientService';
import {
  createUiClientCommonContainer,
  resolveConfig,
} from '../../classes/containers/UiClientCommonContainer';
import { UiClientCommonConfigContextProvider } from '../../context/uiClientCommonConfigContext';

// eslint-disable-next-line react-refresh/only-export-components
const AllTheProviders = ({ children }: PropsWithChildren<unknown>) => {
  const config = resolveConfig();
  const container = createUiClientCommonContainer(config);
  const queryQueryManager = rootContainer.resolve(QueryClientService);
  const emotionCache = container.resolve(EmotionCacheService).emotionCache;

  return (
    <UiClientCommonConfigContextProvider container={container}>
      <QueryClientProvider client={queryQueryManager.queryClient}>
        <CacheProvider value={emotionCache}>
          <ThemeProvider theme={config.theme}>
            <CssBaseline />
            { children }
          </ThemeProvider>
        </CacheProvider>
      </QueryClientProvider>
    </UiClientCommonConfigContextProvider>
  );
};

export const customRender = async (...[ui, options]: Parameters<typeof render>) => {
  return render(ui, { wrapper: AllTheProviders, ...options });
};
