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
import { DependencyContainerUtil } from '../../utils/DependencyContainerUtil';

// eslint-disable-next-line react-refresh/only-export-components
const AllTheProviders = ({ children }: PropsWithChildren<unknown>) => {
  const config = DependencyContainerUtil.resolveConfig();
  DependencyContainerUtil.registerConfig(config);
  const container = DependencyContainerUtil.initializeContainer();
  const queryQueryManager = container.resolve(QueryClientService);
  const emotionCache = container.resolve(EmotionCacheService).emotionCache;

  return (
    <QueryClientProvider client={queryQueryManager.queryClient}>
      <CacheProvider value={emotionCache}>
        <ThemeProvider theme={config.theme}>
          <CssBaseline />
          { children }
        </ThemeProvider>
      </CacheProvider>
    </QueryClientProvider>
  );
};

export const customRender = async (...[ui, options]: Parameters<typeof render>) => {
  return render(ui, { wrapper: AllTheProviders, ...options });
};
