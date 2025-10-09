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
import { ErrorPage } from '../../../pages/ErrorPage';
import { HomePage } from '../../../pages/HomePage';
import { QueryUtil } from '../../../utils/QueryUtil';
import { UserManagerUtil } from '../../../utils/UserManagerUtil';
import { AuthenticationWrapper } from '../../ui/AuthenticationWrapper';
import { AuthorizationWrapper } from '../../ui/AuthorizationWrapper';
import { NotificationsStack } from '../../ui/Notifications';
import { OutageWrapper } from '../../ui/OutageWrapper';
import { Spinner } from '../../ui/Spinner';
import { UserInactivityConfirmation } from '../../ui/UserInactivityConfirmation';


export const RouterRoot = () => {
  const location = useLocation();

  const { isLoading: isIdentityProvidersLoading, error: identityProvidersError, data: identityProviders } = useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.IDENTITY_PROVIDERS),
    queryFn: async ({ signal }) => (await AuthApi.getInstance().identityProvidersGetAll({ signal })).data,
    gcTime: Infinity,
    staleTime: Infinity,
  });

  const oidcConfiguration = useSubscribable(AuthenticationManager.instance);

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
    if (identityProviders?.length === 1) {
      AuthenticationManager.instance.next(identityProviders[0]);
    }
  }, [identityProviders]);

  const userManager = useMemo<UserManager>(() => {
    if (!oidcConfiguration || !identityProviders?.length) {
      return null;
    }

    // Validate the storage
    const identityProvider = identityProviders.find(x => x.name === oidcConfiguration.name);
    if (!identityProvider || JSON.stringify(oidcConfiguration) !== JSON.stringify(identityProvider)) {
      AuthenticationManager.instance.next(undefined);
      return null;
    }
    window.userManager = new UserManager(UserManagerUtil.getSettings(oidcConfiguration));
    return window.userManager;
  }, [identityProviders, oidcConfiguration]);

  if (isIdentityProvidersLoading) {
    return <Spinner />;
  }

  if (identityProvidersError) {
    return <ErrorPage error={identityProvidersError} />;
  }

  if (!oidcConfiguration) {
    return (
      <ChooseIdentityProviderPage identityProviders={identityProviders} />
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
