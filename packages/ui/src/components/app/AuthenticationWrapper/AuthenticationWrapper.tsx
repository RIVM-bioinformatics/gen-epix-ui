import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from 'react-oidc-context';
import { CaseDbLogLevel } from '@gen-epix/api-casedb';

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
    !ConfigManager.instance.config.consentDialog.getShouldShow(),
  );

  const oidcConfiguration = useSubscribable(AuthenticationManager.instance);
  const AfterLoginElement =
    ConfigManager.instance.config.login?.AfterLoginElement;

  useEffect(() => {
    AuthenticationManager.instance.authContextProps = auth;
  }, [auth]);

  useEffect(() => {
    if (auth.isAuthenticated && !hasGivenConsent) {
      consentDialogRef.current.open();
    }
  }, [auth.isAuthenticated, hasGivenConsent]);

  const onConsentDialogConsent = useCallback(() => {
    LogManager.instance.log([
      {
        level: CaseDbLogLevel.INFO,
        topic: 'CONSENT',
      },
    ]);
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
    LogManager.instance.log([
      {
        detail: {
          error: auth.error,
        },
        level: CaseDbLogLevel.ERROR,
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
      AuthenticationManager.instance.getUserManagerSettingsCreatedAt() &&
      now -
        AuthenticationManager.instance.getUserManagerSettingsCreatedAt() <
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
      {ConfigManager.instance.config.consentDialog.getShouldShow() && (
        <ConsentDialog
          onConsent={onConsentDialogConsent}
          ref={consentDialogRef}
        />
      )}
    </>
  );
};
