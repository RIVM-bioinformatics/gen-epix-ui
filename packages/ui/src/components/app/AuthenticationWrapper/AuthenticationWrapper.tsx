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

import { AuthenticationService } from '../../../classes/services/AuthenticationService';
import { ConfigService } from '../../../classes/services/ConfigService';
import { LogService } from '../../../classes/services/LogService';
import { WindowService } from '../../../classes/services/WindowService';
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
    !ConfigService.getInstance().config.consentDialog?.getShouldShow(),
  );

  const oidcConfiguration = useSubscribable(AuthenticationService.getInstance());
  const AfterLoginElement =
    ConfigService.getInstance().config.login?.AfterLoginElement;

  useEffect(() => {
    AuthenticationService.getInstance().authContextProps = auth;
  }, [auth]);

  useEffect(() => {
    if (auth.isAuthenticated && !hasGivenConsent) {
      consentDialogRef.current.open();
    }
  }, [auth.isAuthenticated, hasGivenConsent]);

  const onConsentDialogConsent = useCallback(() => {
    LogService.getInstance().log([
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
      const { hash, pathname, search } = WindowService.getInstance().window.location;

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
    AuthenticationService.clearStaleState();
    AuthenticationService.getInstance().next(undefined);
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
    AuthenticationService.clearStaleState();
    LogService.getInstance().log([
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
      AuthenticationService.getInstance().getUserManagerSettingsCreatedAt() &&
      now -
        AuthenticationService.getInstance().getUserManagerSettingsCreatedAt() <
        AuthenticationService.autoLoginSkew
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
      {ConfigService.getInstance().config.consentDialog?.getShouldShow() && (
        <ConsentDialog
          onConsent={onConsentDialogConsent}
          ref={consentDialogRef}
        />
      )}
    </>
  );
};
