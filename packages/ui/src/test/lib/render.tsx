import { render } from 'vitest-browser-react';
import { CacheProvider } from '@emotion/react';
import { QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import {
  CssBaseline,
  ThemeProvider,
} from '@mui/material';
import {
  ConfigManager,
  ConfigUtil,
  EmotionCacheManager,
  QueryClientManager,
} from '@gen-epix/ui';

ConfigManager.instance.config = ConfigUtil.createDemoConfig();

const queryQueryManager = QueryClientManager.instance;
const emotionCacheManager = EmotionCacheManager.instance;

// eslint-disable-next-line react-refresh/only-export-components
const AllTheProviders = ({ children }: PropsWithChildren<unknown>) => {
  return (
    <QueryClientProvider client={queryQueryManager.queryClient}>
      <CacheProvider value={emotionCacheManager.emotionCache}>
        <ThemeProvider theme={ConfigManager.instance.config.theme}>
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
