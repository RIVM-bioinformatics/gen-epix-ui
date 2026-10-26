import { container } from 'tsyringe';
import {
  StrictMode,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  Outlet,
  useLocation,
} from 'react-router-dom';
import { AuthProvider } from 'react-oidc-context';
import { UserManager } from 'oidc-client-ts';
import axios from 'axios';
import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import { CommonDbLogLevel } from '@gen-epix/api-commondb';
import { useTranslation } from 'react-i18next';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import { useSubscribable } from '@gen-epix/ui-core/hooks/useSubscribable';
import { Spinner } from '@gen-epix/ui-core-components/components/Spinner';

import {
  API_AUTH_TOKEN,
  WINDOW_SERVICE_TOKEN,
} from '../../../constants/api.constants';
import { AuthenticationService } from '../../../classes/services/AuthenticationService';
import { LogService } from '../../../classes/services/LogService';
import { NavigationHistoryService } from '../../../classes/services/NavigationHistoryService';
import { ChooseIdentityProviderPage } from '../../../pages/ChooseIdentityProviderPage';
import { UserManagerUtil } from '../../../utils/UserManagerUtil';
import { NotificationsStack } from '../../ui/Notifications';
import { UserInactivityConfirmation } from '../../ui/UserInactivityConfirmation';
import type { IdentityProviderWithAvailability } from '../../../models/auth.models';
import { useConfig } from '../../../hooks/useConfig';
import { PageContainer } from '../../ui/PageContainer';
import { useQueryMemo } from '../../../hooks/useQueryMemo';
import { ApplicationBootstrapWithAuthentication } from '../ApplicationBootstrapWithAuthentication';
import { AuthenticationWrapper } from '../AuthenticationWrapper';
import { AuthorizationWrapper } from '../AuthorizationWrapper';
import { QueryClientService } from '../../../classes/services/QueryClientService';
import { COMMON_QUERY_KEY } from '../../../constants/query.constants';
import { RouterService } from '../../../classes/services/RouterService';


export const RouterRoot = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const config = useConfig();

  const oidcConfiguration = useSubscribable(container.resolve(AuthenticationService));

  const { data: identityProvidersWithAvailability, error: identityProvidersError, isLoading: isIdentityProvidersLoading } = useQueryMemo<IdentityProviderWithAvailability[], Error, IdentityProviderWithAvailability[]>({
    gcTime: Infinity,
    queryFn: async ({ signal }) => {
      const providers = (await container.resolve(API_AUTH_TOKEN).identityProvidersGetAll({ signal })).data;
      if (!Array.isArray(providers)) {
        throw new Error('Invalid response for identity providers. Backend is most likely misconfigured.');
      }

      const providersWithAvailability: IdentityProviderWithAvailability[] = [];
      for (const provider of providers) {
        try {
          await axios.get(provider.discovery_url, {
            signal,
            timeout: 3000,
          });
          providersWithAvailability.push({
            isAvailable: true,
            provider,
          });
        } catch (error: unknown) {
          console.error(`Identity provider ${provider.name} is not available`, error);
          if (oidcConfiguration?.name === provider.name) {
            container.resolve(AuthenticationService).next(undefined);
          }
          providersWithAvailability.push({
            isAvailable: false,
            provider,
          });
        }
      }
      return providersWithAvailability;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(COMMON_QUERY_KEY.IDENTITY_PROVIDERS),
    staleTime: Infinity,
  });

  const availableIdentityProviders = useMemo<IdentityProviderWithAvailability[]>(() => {
    return identityProvidersWithAvailability?.filter(x => x.isAvailable) ?? [];
  }, [identityProvidersWithAvailability]);

  useEffect(() => {
    container.resolve(NavigationHistoryService).navigationHistory.push(location.pathname);
    container.resolve(LogService).log([{
      detail: {
        pathname: location.pathname,
      },
      level: CommonDbLogLevel.INFO,
      topic: 'USER_NAVIGATION',
    }]);
  }, [location.pathname]);

  useEffect(() => {
    if (identityProvidersWithAvailability?.length === 1 && availableIdentityProviders.length === 1) {
      container.resolve(AuthenticationService).next(identityProvidersWithAvailability[0].provider);
    }
  }, [availableIdentityProviders.length, identityProvidersWithAvailability]);

  const userManager = useMemo<UserManager>(() => {
    if (!oidcConfiguration || !availableIdentityProviders?.length) {
      return null;
    }

    // Validate the storage
    const identityProvider = identityProvidersWithAvailability.find(x => x.provider.name === oidcConfiguration.name)?.provider;
    if (!identityProvider || JSON.stringify(oidcConfiguration) !== JSON.stringify(identityProvider)) {
      container.resolve(AuthenticationService).next(undefined);
      return null;
    }
    const windowService = container.resolve(WINDOW_SERVICE_TOKEN);
    windowService.window.userManager = new UserManager(UserManagerUtil.getSettings(oidcConfiguration));
    return windowService.window.userManager;
  }, [availableIdentityProviders, identityProvidersWithAvailability, oidcConfiguration]);

  const onSignin = useCallback(() => {
    container.resolve(LogService).log([{
      level: CommonDbLogLevel.INFO,
      topic: 'USER_LOGIN',
    }]);
  }, []);

  const onTryAgainButtonClick = useCallback(() => {
    window.location.reload();
  }, []);

  if (isIdentityProvidersLoading) {
    return <Spinner />;
  }

  if (identityProvidersError) {
    return (
      <PageContainer
        singleAction
        testIdAttributes={TestIdUtil.createAttributes('ErrorPage')}
        title={t('Error')}
      >
        <Box
          sx={{
            marginY: 2,
            textAlign: 'center',
          }}
        >
          <Typography>
            {t('{{applicationName}} is currently unavailable. Please try again later.', { applicationName: config.applicationName })}
          </Typography>
          <Box sx={{ marginTop: 2 }}>
            <Button
              onClick={onTryAgainButtonClick}
              variant={'outlined'}
            >
              {t`Try again`}
            </Button>
          </Box>
        </Box>
      </PageContainer>
    );
  }

  if (!oidcConfiguration) {
    return (
      <ChooseIdentityProviderPage identityProvidersWithAvailability={identityProvidersWithAvailability} />
    );
  }

  const HomePage = container.resolve(RouterService).homePageComponent;

  return (
    <AuthProvider
      onSigninCallback={onSignin}
      userManager={userManager}
    >
      <AuthenticationWrapper>
        <ApplicationBootstrapWithAuthentication>
          <AuthorizationWrapper>
            <UserInactivityConfirmation />
            <NotificationsStack />
            <StrictMode>
              {location?.pathname === '/' ? <HomePage /> : <Outlet />}
            </StrictMode>
          </AuthorizationWrapper>
        </ApplicationBootstrapWithAuthentication>
      </AuthenticationWrapper>
    </AuthProvider>
  );
};
