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
import { useQuery } from '@tanstack/react-query';
import { AuthProvider } from 'react-oidc-context';
import { UserManager } from 'oidc-client-ts';
import axios from 'axios';
import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import { t } from 'i18next';

import {
  AuthApi,
  LogLevel,
} from '../../../api';
import { AuthenticationManager } from '../../../classes/managers/AuthenticationManager';
import { LogManager } from '../../../classes/managers/LogManager';
import { NavigationHistoryManager } from '../../../classes/managers/NavigationHistoryManager';
import { useSubscribable } from '../../../hooks/useSubscribable';
import { QUERY_KEY } from '../../../models/query';
import { ChooseIdentityProviderPage } from '../../../pages/ChooseIdentityProviderPage';
import { HomePage } from '../../../pages/HomePage';
import { QueryUtil } from '../../../utils/QueryUtil';
import { UserManagerUtil } from '../../../utils/UserManagerUtil';
import { AuthenticationWrapper } from '../../ui/AuthenticationWrapper';
import { AuthorizationWrapper } from '../../ui/AuthorizationWrapper';
import { NotificationsStack } from '../../ui/Notifications';
import { OutageWrapper } from '../../ui/OutageWrapper';
import { Spinner } from '../../ui/Spinner';
import { UserInactivityConfirmation } from '../../ui/UserInactivityConfirmation';
import type { IdentityProviderWithAvailability } from '../../../models/auth';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import { PageContainer } from '../../ui/PageContainer';


export const RouterRoot = () => {
  const location = useLocation();

  const oidcConfiguration = useSubscribable(AuthenticationManager.instance);

  const { isLoading: isIdentityProvidersLoading, error: identityProvidersError, data: identityProvidersWithAvailability } = useQuery<IdentityProviderWithAvailability[], Error, IdentityProviderWithAvailability[]>({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.IDENTITY_PROVIDERS),
    queryFn: async ({ signal }) => {
      const providers = (await AuthApi.getInstance().identityProvidersGetAll({ signal })).data;
      const providersWithAvailability: IdentityProviderWithAvailability[] = [];
      for (const provider of providers) {
        let isAvailable = false;
        try {
          await axios.get(provider.discovery_url, {
            signal,
            timeout: 3000,
          });
          isAvailable = true;
        } catch {
          if (oidcConfiguration?.name === provider.name) {
            AuthenticationManager.instance.next(undefined);
          }
          isAvailable = false;
        }
        providersWithAvailability.push({
          provider,
          isAvailable,
        });
      }
      return providersWithAvailability;
    },
    gcTime: Infinity,
    staleTime: Infinity,
  });

  const availableIdentityProviders = useMemo<IdentityProviderWithAvailability[]>(() => {
    return identityProvidersWithAvailability?.filter(x => x.isAvailable) ?? [];
  }, [identityProvidersWithAvailability]);

  const onSignin = useCallback(() => {
    LogManager.instance.log([{
      topic: 'USER_LOGIN',
      level: LogLevel.INFO,
    }]);
  }, []);

  useEffect(() => {
    NavigationHistoryManager.instance.navigationHistory.push(location.pathname);
    LogManager.instance.log([{
      topic: 'USER_NAVIGATION',
      level: LogLevel.INFO,
      detail: {
        pathname: location.pathname,
      },
    }]);
  }, [location.pathname]);

  useEffect(() => {
    if (identityProvidersWithAvailability?.length === 1 && availableIdentityProviders.length === 1) {
      AuthenticationManager.instance.next(identityProvidersWithAvailability[0].provider);
    }
  }, [availableIdentityProviders.length, identityProvidersWithAvailability]);

  const onTryAgainButtonClick = useCallback(() => {
    window.location.reload();
  }, []);

  const userManager = useMemo<UserManager>(() => {
    if (!oidcConfiguration || !availableIdentityProviders?.length) {
      return null;
    }

    // Validate the storage
    const identityProvider = identityProvidersWithAvailability.find(x => x.provider.name === oidcConfiguration.name)?.provider;
    if (!identityProvider || JSON.stringify(oidcConfiguration) !== JSON.stringify(identityProvider)) {
      AuthenticationManager.instance.next(undefined);
      return null;
    }
    window.userManager = new UserManager(UserManagerUtil.getSettings(oidcConfiguration));
    return window.userManager;
  }, [availableIdentityProviders?.length, identityProvidersWithAvailability, oidcConfiguration]);

  if (isIdentityProvidersLoading) {
    return <Spinner />;
  }


  if (identityProvidersError) {
    return (
      <PageContainer
        singleAction
        title={'Error'}
        testIdAttributes={TestIdUtil.createAttributes('ErrorPage')}
      >
        <Box
          marginY={2}
          sx={{
            textAlign: 'center',
          }}
        >
          <Typography>
            {t('{{applicationName}} is currently unavailable. Please try again later.', { applicationName: ConfigManager.instance.config.applicationName })}
          </Typography>
          <Box sx={{ marginTop: 2 }}>
            <Button
              variant={'outlined'}
              onClick={onTryAgainButtonClick}
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

  return (
    <AuthProvider
      userManager={userManager}
      onSigninCallback={onSignin}
    >
      <AuthenticationWrapper>
        <OutageWrapper>
          <AuthorizationWrapper>
            <UserInactivityConfirmation />
            <NotificationsStack />
            <StrictMode>
              {location?.pathname === '/' ? <HomePage /> : <Outlet /> }
            </StrictMode>
          </AuthorizationWrapper>
        </OutageWrapper>
      </AuthenticationWrapper>
    </AuthProvider>
  );
};
