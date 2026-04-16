import { CacheProvider } from '@emotion/react';
import {
  CssBaseline,
  ThemeProvider,
} from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { RouterProvider } from 'react-router-dom';
import { CaseDbBaseAPI } from '@gen-epix/api-casedb';

import { AuthenticationManager } from '../../../classes/managers/AuthenticationManager';
import { BackendVersionManager } from '../../../classes/managers/BackendVersionManager';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { LogManager } from '../../../classes/managers/LogManager';
import { QueryClientManager } from '../../../classes/managers/QueryClientManager';
import { RouterManager } from '../../../classes/managers/RouterManager';
import { ErrorPage } from '../../../pages/ErrorPage';
import { EmotionCacheManager } from '../../../classes/managers/EmotionCacheManager';
import { APP } from '../../../models/app';

export const App = () => {
  const { config } = ConfigManager.instance;
  const touchIconUrl = config.getTouchIconUrl();
  if (touchIconUrl) {
    // eslint-disable-next-line @eslint-react/purity
    document.querySelector('link[rel="icon"]')?.setAttribute('href', touchIconUrl);
  }

  CaseDbBaseAPI.baseUrl = config.getAPIBaseUrl(APP.CASEDB);
  CaseDbBaseAPI.defaultRequestTimeout = config.defaultRequestTimeout;
  CaseDbBaseAPI.onRequest = [
    AuthenticationManager.instance.onRequest.bind(AuthenticationManager.instance),
    LogManager.instance.onRequest.bind(LogManager.instance),
  ];
  CaseDbBaseAPI.onResponseFulfilled = [
    LogManager.instance.onResponseFulfilled.bind(LogManager.instance),
    BackendVersionManager.instance.onResponseFulfilled.bind(BackendVersionManager.instance),
  ];
  CaseDbBaseAPI.onResponseRejected = [
    LogManager.instance.onResponseRejected.bind(LogManager.instance),
    AuthenticationManager.instance.onResponseRejected.bind(AuthenticationManager.instance),
  ];

  const queryQueryManager = QueryClientManager.instance;
  const routerManager = RouterManager.instance;
  const emotionCacheManager = EmotionCacheManager.instance;

  return (
    <QueryClientProvider client={queryQueryManager.queryClient}>
      <CacheProvider value={emotionCacheManager.emotionCache}>
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
