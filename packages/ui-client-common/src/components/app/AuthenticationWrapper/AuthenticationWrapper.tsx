import { container } from 'tsyringe';
import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';
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
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import { useSubscribable } from '@gen-epix/ui-core/hooks/useSubscribable';
import { Spinner } from '@gen-epix/ui-core-components/components/Spinner';

import { AuthenticationService } from '../../../classes/services/AuthenticationService';
import { LogService } from '../../../classes/services/LogService';
import { useConfig } from '../../../hooks/useConfig';
import type { AuthState } from '../../../models/auth.models';
import type { ConsentDialogRefMethods } from '../../ui/ConsentDialog';
import { ConsentDialog } from '../../ui/ConsentDialog';
import { PageContainer } from '../../ui/PageContainer';

export const AuthenticationWrapper = ({ children }: PropsWithChildren) => {
  const { t } = useTranslation();
  const auth = useAuth();
  const config = useConfig();
  const consentDialogRef = useRef<ConsentDialogRefMethods>(null);
  const [hasGivenConsent, setHasGivenConsent] = useState<boolean>(
    !config.consentDialog?.getShouldShow(),
  );

  const oidcConfiguration = useSubscribable(container.resolve(AuthenticationService));
  const AfterLoginElement = config.login?.AfterLoginElement;

  useEffect(() => {
    container.resolve(AuthenticationService).authContextProps = auth;
  }, [auth]);

  useEffect(() => {
    if (auth.isAuthenticated && !hasGivenConsent) {
      consentDialogRef.current.open();
    }
  }, [auth.isAuthenticated, hasGivenConsent]);

  const onConsentDialogConsent = useCallback(() => {
    container.resolve(LogService).log([
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
      const { hash, pathname, search } = container.resolve(WindowService).window.location;

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
    container.resolve(AuthenticationService).next(undefined);
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
    container.resolve(LogService).log([
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
      container.resolve(AuthenticationService).getUserManagerSettingsCreatedAt() &&
      now -
        container.resolve(AuthenticationService).getUserManagerSettingsCreatedAt() <
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
      {config.consentDialog?.getShouldShow() && (
        <ConsentDialog
          onConsent={onConsentDialogConsent}
          ref={consentDialogRef}
        />
      )}
    </>
  );
};
