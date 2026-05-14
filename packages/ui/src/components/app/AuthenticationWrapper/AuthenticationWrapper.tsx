import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from 'react-oidc-context';
import { CommonDbLogLevel } from '@gen-epix/api-commondb';

import { AuthenticationManager } from '../../../classes/managers/AuthenticationManager';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { LogManager } from '../../../classes/managers/LogManager';
import { WindowManager } from '../../../classes/managers/WindowManager';
import { useSubscribable } from '../../../hooks/useSubscribable';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import type { AuthState } from '../../../models/auth';
import type { ConsentDialogRefMethods } from '../../ui/ConsentDialog';
import { ConsentDialog } from '../../ui/ConsentDialog';
import { PageContainer } from '../../ui/PageContainer';
import { Spinner } from '../../ui/Spinner';

export const AuthenticationWrapper = ({ children }: PropsWithChildren) => {
  const { t } = useTranslation();
  const auth = useAuth();
  const consentDialogRef = useRef<ConsentDialogRefMethods>(null);
  const [hasGivenConsent, setHasGivenConsent] = useState<boolean>(
    !ConfigManager.getInstance().config.consentDialog.getShouldShow(),
  );

  const oidcConfiguration = useSubscribable(AuthenticationManager.getInstance());
  const AfterLoginElement =
    ConfigManager.getInstance().config.login?.AfterLoginElement;

  useEffect(() => {
    AuthenticationManager.getInstance().authContextProps = auth;
  }, [auth]);

  useEffect(() => {
    if (auth.isAuthenticated && !hasGivenConsent) {
      consentDialogRef.current.open();
    }
  }, [auth.isAuthenticated, hasGivenConsent]);

  const onConsentDialogConsent = useCallback(() => {
    LogManager.getInstance().log([
      {
        level: CommonDbLogLevel.INFO,
        topic: 'CONSENT',
      },
    ]);
    setHasGivenConsent(true);
    consentDialogRef.current.close();
  }, []);

  const login = useCallback(() => {
    const perform = async () => {
      const { hash, pathname, search } = WindowManager.getInstance().window.location;

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
    AuthenticationManager.getInstance().next(undefined);
  }, []);

  const now = useMemo(() => new Date().getTime(), []);

  const loginElement = useMemo(
    () => (
      <>
        <Box
          sx={{
            marginY: 2,
            textAlign: 'center',
          }}
        >
          <Button
            color={'primary'}
            data-name={oidcConfiguration.name}
            onClick={onLoginButtonClick}
            variant={'contained'}
          >
            {oidcConfiguration.label}
          </Button>
        </Box>
        <Box
          sx={{
            marginY: 2,
            textAlign: 'center',
          }}
        >
          <Button
            color={'primary'}
            onClick={onChangeLoginProviderButtonClick}
            variant={'outlined'}
          >
            {t`Choose a different identity provider`}
          </Button>
        </Box>
        {AfterLoginElement && <AfterLoginElement />}
      </>
    ), [oidcConfiguration, onChangeLoginProviderButtonClick, onLoginButtonClick, t, AfterLoginElement],
  );

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
    LogManager.getInstance().log([
      {
        detail: {
          error: auth.error,
        },
        level: CommonDbLogLevel.ERROR,
        topic: 'Authentication Error',
      },
    ]);

    return (
      <PageContainer
        singleAction
        testIdAttributes={TestIdUtil.createAttributes(
          'LoginPageSessionExpired',
        )}
        title={t`Login`}
      >
        <Typography
          component={'p'}
          sx={{ textAlign: 'center' }}
        >
          {t`We could not log you in, or your session has expired.`}
        </Typography>
        {loginElement}
      </PageContainer>
    );
  }

  if (!auth.isAuthenticated) {
    if (
      AuthenticationManager.getInstance().getUserManagerSettingsCreatedAt() &&
      now -
        AuthenticationManager.getInstance().getUserManagerSettingsCreatedAt() <
        AuthenticationManager.autoLoginSkew
    ) {
      login();
      return;
    }
    return (
      <PageContainer
        singleAction
        testIdAttributes={TestIdUtil.createAttributes('LoginPage')}
        title={t`Login`}
      >
        <Box
          sx={{
            marginY: 2,
            textAlign: 'center',
          }}
        >
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
      {ConfigManager.getInstance().config.consentDialog.getShouldShow() && (
        <ConsentDialog
          onConsent={onConsentDialogConsent}
          ref={consentDialogRef}
        />
      )}
    </>
  );
};
