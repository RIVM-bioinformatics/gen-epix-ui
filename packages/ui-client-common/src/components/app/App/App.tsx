import { CacheProvider } from '@emotion/react';
import {
  CssBaseline,
  ThemeProvider,
} from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

import { BackendVersionService } from '../../../classes/services/BackendVersionService';
import { QueryClientService } from '../../../classes/services/QueryClientService';
import { ErrorPage } from '../../../pages/ErrorPage';
import { EmotionCacheService } from '../../../classes/services/EmotionCacheService';
import { AuthenticationService } from '../../../classes/services/AuthenticationService';
import { LogService } from '../../../classes/services/LogService';
import { ApiService } from '../../../classes/services/ApiService';
import { ApplicationBootstrapWithoutAuthorization } from '../ApplicationBootstrapWithoutAuthorization';
import { AppRouterProvider } from '../AppRouterProvider/AppRouterProvider';
import { UiClientCommonConfigContextProvider } from '../../../context/uiClientCommonConfigContext';
import type { UiClientCommonContainer } from '../../../classes/containers/UiClientCommonContainer';
import { resolveConfig } from '../../../classes/containers/UiClientCommonContainer';
import type { ConfigBase } from '../../../models/config';

export type AppProps = {
  readonly container: UiClientCommonContainer;
};

export const App = ({ container }: AppProps) => {
  const config = resolveConfig<ConfigBase>(container);

  const authenticationService = AuthenticationService.getInstance();
  const logService = LogService.getInstance();
  const touchIconUrl = config.getTouchIconUrl();
  if (touchIconUrl) {
    document.querySelector('link[rel="icon"]')?.setAttribute('href', touchIconUrl);
  }
  const apiService = ApiService.getInstance();
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

  const queryClientService = container.resolve(QueryClientService);
  const emotionCache = container.resolve(EmotionCacheService).emotionCache;

  return (
    <UiClientCommonConfigContextProvider container={container}>
      <QueryClientProvider client={queryClientService.queryClient}>
        <CacheProvider value={emotionCache}>
          <ThemeProvider theme={config.theme}>
            <CssBaseline />
            <ErrorBoundary FallbackComponent={ErrorPage}>
              <ApplicationBootstrapWithoutAuthorization>
                <AppRouterProvider />
              </ApplicationBootstrapWithoutAuthorization>
            </ErrorBoundary>
          </ThemeProvider>
        </CacheProvider>
      </QueryClientProvider>
    </UiClientCommonConfigContextProvider>
  );
};
