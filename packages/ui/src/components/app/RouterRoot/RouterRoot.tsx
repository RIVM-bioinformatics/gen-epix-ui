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

import { AuthenticationManager } from '../../../classes/managers/AuthenticationManager';
import { LogManager } from '../../../classes/managers/LogManager';
import { NavigationHistoryManager } from '../../../classes/managers/NavigationHistoryManager';
import { useSubscribable } from '../../../hooks/useSubscribable';
import { ChooseIdentityProviderPage } from '../../../pages/ChooseIdentityProviderPage';
import { UserManagerUtil } from '../../../utils/UserManagerUtil';
import { NotificationsStack } from '../../ui/Notifications';
import { Spinner } from '../../ui/Spinner';
import { UserInactivityConfirmation } from '../../ui/UserInactivityConfirmation';
import type { IdentityProviderWithAvailability } from '../../../models/auth';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import { PageContainer } from '../../ui/PageContainer';
import { useQueryMemo } from '../../../hooks/useQueryMemo';
import { ApplicationBootstrap } from '../ApplicationBootstrap';
import { AuthenticationWrapper } from '../AuthenticationWrapper';
import { AuthorizationWrapper } from '../AuthorizationWrapper';
import { QueryClientManager } from '../../../classes/managers/QueryClientManager';
import { COMMON_QUERY_KEY } from '../../../data/query';
import { RouterManager } from '../../../classes/managers/RouterManager';


export const RouterRoot = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const oidcConfiguration = useSubscribable(AuthenticationManager.getInstance());

  const { data: identityProvidersWithAvailability, error: identityProvidersError, isLoading: isIdentityProvidersLoading } = useQueryMemo<IdentityProviderWithAvailability[], Error, IdentityProviderWithAvailability[]>({
    gcTime: Infinity,
    queryFn: async ({ signal }) => {
      const providers = (await ConfigManager.getInstance().config.authApi.identityProvidersGetAll({ signal })).data;
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
          console.log(`Identity provider ${provider.name} is not available`, error);
          if (oidcConfiguration?.name === provider.name) {
            AuthenticationManager.getInstance().next(undefined);
          }
          providersWithAvailability.push({
            isAvailable: false,
            provider,
          });
        }
      }
      return providersWithAvailability;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(COMMON_QUERY_KEY.IDENTITY_PROVIDERS),
    staleTime: Infinity,
  });

  const availableIdentityProviders = useMemo<IdentityProviderWithAvailability[]>(() => {
    return identityProvidersWithAvailability?.filter(x => x.isAvailable) ?? [];
  }, [identityProvidersWithAvailability]);

  useEffect(() => {
    NavigationHistoryManager.getInstance().navigationHistory.push(location.pathname);
    LogManager.getInstance().log([{
      detail: {
        pathname: location.pathname,
      },
      level: CommonDbLogLevel.INFO,
      topic: 'USER_NAVIGATION',
    }]);
  }, [location.pathname]);

  useEffect(() => {
    if (identityProvidersWithAvailability?.length === 1 && availableIdentityProviders.length === 1) {
      AuthenticationManager.getInstance().next(identityProvidersWithAvailability[0].provider);
    }
  }, [availableIdentityProviders.length, identityProvidersWithAvailability]);

  const userManager = useMemo<UserManager>(() => {
    if (!oidcConfiguration || !availableIdentityProviders?.length) {
      return null;
    }

    // Validate the storage
    const identityProvider = identityProvidersWithAvailability.find(x => x.provider.name === oidcConfiguration.name)?.provider;
    if (!identityProvider || JSON.stringify(oidcConfiguration) !== JSON.stringify(identityProvider)) {
      AuthenticationManager.getInstance().next(undefined);
      return null;
    }
    window.userManager = new UserManager(UserManagerUtil.getSettings(oidcConfiguration));
    return window.userManager;
  }, [availableIdentityProviders?.length, identityProvidersWithAvailability, oidcConfiguration]);

  const onSignin = useCallback(() => {
    LogManager.getInstance().log([{
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
            {t('{{applicationName}} is currently unavailable. Please try again later.', { applicationName: ConfigManager.getInstance().config.applicationName })}
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

  const HomePage = RouterManager.getInstance().homePageComponent;

  return (
    <AuthProvider
      onSigninCallback={onSignin}
      userManager={userManager}
    >
      <AuthenticationWrapper>
        <ApplicationBootstrap>
          <AuthorizationWrapper>
            <UserInactivityConfirmation />
            <NotificationsStack />
            <StrictMode>
              {location?.pathname === '/' ? <HomePage /> : <Outlet /> }
            </StrictMode>
          </AuthorizationWrapper>
        </ApplicationBootstrap>
      </AuthenticationWrapper>
    </AuthProvider>
  );
};
