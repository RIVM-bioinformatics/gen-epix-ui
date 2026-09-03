import { render } from 'vitest-browser-react';
import { CacheProvider } from '@emotion/react';
import { QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import {
  CssBaseline,
  ThemeProvider,
} from '@mui/material';

import { ConfigService } from '../../classes/services/ConfigService';
import { EmotionCacheService } from '../../classes/services/EmotionCacheService';
import { QueryClientService } from '../../classes/services/QueryClientService';

// eslint-disable-next-line react-refresh/only-export-components
const AllTheProviders = ({ children }: PropsWithChildren<unknown>) => {
  const queryQueryManager = QueryClientService.getInstance();
  const emotionCacheService = EmotionCacheService.getInstance();

  return (
    <QueryClientProvider client={queryQueryManager.queryClient}>
      <CacheProvider value={emotionCacheService.emotionCache}>
        <ThemeProvider theme={ConfigService.getInstance().config.theme}>
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
