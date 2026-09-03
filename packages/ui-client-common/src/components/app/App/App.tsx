import { CacheProvider } from '@emotion/react';
import {
  CssBaseline,
  ThemeProvider,
} from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { RouterProvider } from 'react-router-dom';
import { useMemo } from 'react';
import { UiCoreComponentsContextProvider } from '@gen-epix/ui-core-components/context/uiCoreComponentsConfigContext';
import type { UiCoreComponentsConfig } from '@gen-epix/ui-core-components/context/uiCoreComponentsConfigContext';

import { BackendVersionService } from '../../../classes/services/BackendVersionService';
import { ConfigService } from '../../../classes/services/ConfigService';
import { QueryClientService } from '../../../classes/services/QueryClientService';
import { ErrorPage } from '../../../pages/ErrorPage';
import { EmotionCacheService } from '../../../classes/services/EmotionCacheService';
import { AuthenticationService } from '../../../classes/services/AuthenticationService';
import { LogService } from '../../../classes/services/LogService';
import { ApiService } from '../../../classes/services/ApiService';
import { RouterService } from '../../../classes/services/RouterService';


export const App = () => {
  const { config } = ConfigService.getInstance();

  const uiCoreComponentsConfig = useMemo<UiCoreComponentsConfig>(() => {
    const { DEFAULT_CIRCULAR_PROGRESS_SIZE, DEFAULT_TAKING_LONGER_TIMEOUT_MS } = config.spinner;

    return {
      spinner: {
        defaultCircularProgressSize: DEFAULT_CIRCULAR_PROGRESS_SIZE,
        defaultTakingLongerTimeoutMs: DEFAULT_TAKING_LONGER_TIMEOUT_MS,
      },
    };
  }, [config.spinner]);

  const authenticationService = AuthenticationService.getInstance();
  const logService = LogService.getInstance();

  const touchIconUrl = config.getTouchIconUrl();
  if (touchIconUrl) {

    document.querySelector('link[rel="icon"]')?.setAttribute('href', touchIconUrl);
  }
  const apiService = ApiService.getInstance();
  const routerService = RouterService.getInstance();
  apiService.api.baseUrl = config.getAPIBaseUrl();
  apiService.api.defaultRequestTimeout = config.defaultRequestTimeout;
  apiService.api.onRequest = [
    authenticationService.onRequest.bind(authenticationService),
    logService.onRequest.bind(logService),
  ];
  apiService.api.onResponseFulfilled = [
    logService.onResponseFulfilled.bind(logService),
    BackendVersionService.getInstance().onResponseFulfilled.bind(BackendVersionService.getInstance()),
  ];
  apiService.api.onResponseRejected = [
    logService.onResponseRejected.bind(logService),
    authenticationService.onResponseRejected.bind(authenticationService),
  ];

  const queryQueryManager = QueryClientService.getInstance();
  const emotionCacheService = EmotionCacheService.getInstance();

  return (
    <UiCoreComponentsContextProvider config={uiCoreComponentsConfig}>
      <QueryClientProvider client={queryQueryManager.queryClient}>
        <CacheProvider value={emotionCacheService.emotionCache}>
          <ThemeProvider theme={ConfigService.getInstance().config.theme}>
            <CssBaseline />
            <ErrorBoundary FallbackComponent={ErrorPage}>
              <RouterProvider router={routerService.router} />
            </ErrorBoundary>
          </ThemeProvider>
        </CacheProvider>
      </QueryClientProvider>
    </UiCoreComponentsContextProvider>
  );
};
