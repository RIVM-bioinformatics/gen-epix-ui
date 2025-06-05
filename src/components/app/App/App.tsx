import { CacheProvider } from '@emotion/react';
import {
  CssBaseline,
  ThemeProvider,
} from '@mui/material';
import createCache from '@emotion/cache';
import { QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { RouterProvider } from 'react-router-dom';

import { BaseAPI } from '../../../api';
import { AuthenticationManager } from '../../../classes/managers/AuthenticationManager';
import { BackendVersionManager } from '../../../classes/managers/BackendVersionManager';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { LogManager } from '../../../classes/managers/LogManager';
import { QueryClientManager } from '../../../classes/managers/QueryClientManager';
import { RouterManager } from '../../../classes/managers/RouterManager';
import { ErrorPage } from '../../../pages/ErrorPage';

export const App = () => {
  const { config } = ConfigManager.instance;
  const touchIconUrl = config.getTouchIconUrl();
  if (touchIconUrl) {
    document.querySelector('link[rel="icon"]')?.setAttribute('href', touchIconUrl);
  }

  BaseAPI.baseUrl = config.getAPIBaseUrl();
  BaseAPI.defaultRequestTimeout = config.defaultRequestTimeout;
  BaseAPI.onRequest = [
    AuthenticationManager.instance.onRequest.bind(AuthenticationManager.instance),
    LogManager.instance.onRequest.bind(LogManager.instance),
  ];
  BaseAPI.onResponseFulfilled = [
    LogManager.instance.onResponseFulfilled.bind(LogManager.instance),
    BackendVersionManager.instance.onResponseFulfilled.bind(BackendVersionManager.instance),
  ];
  BaseAPI.onResponseRejected = [
    LogManager.instance.onResponseRejected.bind(LogManager.instance),
    AuthenticationManager.instance.onResponseRejected.bind(AuthenticationManager.instance),
  ];

  const emotionCache = createCache({
    key: 'genepix',
    stylisPlugins: [],
    nonce: 'genepix',
    prepend: true,
  });

  const queryQueryManager = QueryClientManager.instance;
  const routerManager = RouterManager.instance;

  return (
    <QueryClientProvider client={queryQueryManager.queryClient}>
      <CacheProvider value={emotionCache}>
        <ThemeProvider theme={ConfigManager.instance.config.theme}>
          <CssBaseline />
          <ErrorBoundary FallbackComponent={ErrorPage}>
            <RouterProvider router={routerManager.router} />
          </ErrorBoundary>
        </ThemeProvider>
      </CacheProvider>
    </QueryClientProvider>
  );
};
