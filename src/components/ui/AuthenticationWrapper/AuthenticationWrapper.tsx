import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import {
  useCallback,
  type PropsWithChildren,
  useRef,
  useState,
  useEffect,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from 'react-oidc-context';

import { PageContainer } from '../PageContainer';
import type { ConsentDialogRefMethods } from '../ConsentDialog';
import { ConsentDialog } from '../ConsentDialog';
import { Spinner } from '../Spinner';
import { LogLevel } from '../../../api';
import { AuthenticationManager } from '../../../classes/managers/AuthenticationManager';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { LogManager } from '../../../classes/managers/LogManager';
import { WindowManager } from '../../../classes/managers/WindowManager';
import { useSubscribable } from '../../../hooks/useSubscribable';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import type { AuthState } from '../../../models/auth';

export const AuthenticationWrapper = ({ children }: PropsWithChildren) => {
  const [t] = useTranslation();
  const auth = useAuth();
  const consentDialogRef = useRef<ConsentDialogRefMethods>(null);
  const [hasGivenConsent, setHasGivenConsent] = useState<boolean>(!ConfigManager.instance.config.consentDialog.getShouldShow());

  const oidcConfiguration = useSubscribable(AuthenticationManager.instance);

  useEffect(() => {
    AuthenticationManager.instance.authContextProps = auth;
  }, [auth]);

  useEffect(() => {
    if (auth.isAuthenticated && !hasGivenConsent) {
      consentDialogRef.current.open();
    }
  }, [auth.isAuthenticated, hasGivenConsent]);

  const onConsentDialogConsent = useCallback(() => {
    LogManager.instance.log([{
      topic: 'CONSENT',
      level: LogLevel.INFO,
    }]);
    setHasGivenConsent(true);
    consentDialogRef.current.close();
  }, []);

  const login = useCallback(() => {
    const perform = async () => {
      const { hash, pathname, search } = WindowManager.instance.window.location;

      const state: AuthState = {
        preLoginLocation: {
          hash,
          pathname,
          search,
        },
      };
      await auth.signinRedirect({
        state,
      });
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();
  }, [auth]);

  const onLoginButtonClick = useCallback(() => {
    login();
  }, [login]);

  const onChangeLoginProviderButtonClick = useCallback(() => {
    AuthenticationManager.clearStaleState();
    AuthenticationManager.instance.next(undefined);
  }, []);

  const loginElement = useMemo(() => (
    <>
      <Box marginY={2}>
        <Button
          onClick={onLoginButtonClick}
        >
          {oidcConfiguration.label}
        </Button>
      </Box>
      <Box marginY={2}>
        <Button
          color={'primary'}
          variant={'outlined'}
          onClick={onChangeLoginProviderButtonClick}
        >
          {t`Choose a different identity provider`}
        </Button>
      </Box>
    </>
  ), [oidcConfiguration, onChangeLoginProviderButtonClick, onLoginButtonClick, t]);

  if (auth.activeNavigator || auth.isLoading) {
    return (
      <PageContainer
        ignorePageEvent
        singleAction
        testIdAttributes={TestIdUtil.createAttributes('RedirectingPage')}
        title={t`Redirecting`}
      >
        <Spinner label={t`Redirecting`} />
      </PageContainer>
    );
  }

  if (auth.error) {
    AuthenticationManager.clearStaleState();
    LogManager.instance.log([{
      detail: {
        error: auth.error,
      },
      level: LogLevel.ERROR,
      topic: 'Authentication Error',
    }]);

    return (
      <PageContainer
        singleAction
        testIdAttributes={TestIdUtil.createAttributes('LoginPageSessionExpired')}
        title={t`Login`}
      >
        <p>
          {t`We could not log you in, or your session has expired.`}
        </p>
        {loginElement}
      </PageContainer>
    );
  }

  if (!auth.isAuthenticated) {
    if (AuthenticationManager.instance.getUserManagerSettingsCreatedAt() && new Date().getTime() - AuthenticationManager.instance.getUserManagerSettingsCreatedAt() < AuthenticationManager.autoLoginSkew) {
      login();
      return;
    }
    return (
      <PageContainer
        singleAction
        testIdAttributes={TestIdUtil.createAttributes('LoginPage')}
        title={t`Login`}
      >
        <Box marginY={2}>
          <Typography component={'p'}>
            {t`You need to login to access this application.`}
          </Typography>
        </Box>
        {loginElement}
      </PageContainer>
    );
  }

  return (
    <>
      {children}
      {ConfigManager.instance.config.consentDialog.getShouldShow() && (
        <ConsentDialog
          ref={consentDialogRef}
          onConsent={onConsentDialogConsent}
        />
      )}
    </>
  );
};
