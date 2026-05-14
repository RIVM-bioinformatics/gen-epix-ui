import { CacheProvider } from '@emotion/react';
import {
  CssBaseline,
  ThemeProvider,
} from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { RouterProvider } from 'react-router-dom';

import { BackendVersionManager } from '../../../classes/managers/BackendVersionManager';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { QueryClientManager } from '../../../classes/managers/QueryClientManager';
import { ErrorPage } from '../../../pages/ErrorPage';
import { EmotionCacheManager } from '../../../classes/managers/EmotionCacheManager';
import { AuthenticationManager } from '../../../classes/managers/AuthenticationManager';
import { LogManager } from '../../../classes/managers/LogManager';
import { ApiManager } from '../../../classes/managers/ApiManager';
import { RouterManager } from '../../../classes/managers/RouterManager';


export const App = () => {
  const { config } = ConfigManager.getInstance();

  const authenticationManager = AuthenticationManager.getInstance();
  const logManager = LogManager.getInstance();

  const touchIconUrl = config.getTouchIconUrl();
  if (touchIconUrl) {

    document.querySelector('link[rel="icon"]')?.setAttribute('href', touchIconUrl);
  }
  const apiManager = ApiManager.getInstance();
  const routerManager = RouterManager.getInstance();
  apiManager.api.baseUrl = config.getAPIBaseUrl();
  apiManager.api.defaultRequestTimeout = config.defaultRequestTimeout;
  apiManager.api.onRequest = [
    authenticationManager.onRequest.bind(authenticationManager),
    logManager.onRequest.bind(logManager),
  ];
  apiManager.api.onResponseFulfilled = [
    logManager.onResponseFulfilled.bind(logManager),
    BackendVersionManager.getInstance().onResponseFulfilled.bind(BackendVersionManager.getInstance()),
  ];
  apiManager.api.onResponseRejected = [
    logManager.onResponseRejected.bind(logManager),
    authenticationManager.onResponseRejected.bind(authenticationManager),
  ];

  const queryQueryManager = QueryClientManager.getInstance();
  const emotionCacheManager = EmotionCacheManager.getInstance();

  return (
    <QueryClientProvider client={queryQueryManager.queryClient}>
      <CacheProvider value={emotionCacheManager.emotionCache}>
        <ThemeProvider theme={ConfigManager.getInstance().config.theme}>
          <CssBaseline />
          <ErrorBoundary FallbackComponent={ErrorPage}>
            <RouterProvider router={routerManager.router} />
          </ErrorBoundary>
        </ThemeProvider>
      </CacheProvider>
    </QueryClientProvider>
  );
};
