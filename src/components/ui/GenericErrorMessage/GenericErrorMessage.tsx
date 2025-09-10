import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { isRouteErrorResponse } from 'react-router-dom';
import { isAxiosError } from 'axios';

import { LogLevel } from '../../../api';
import { AxiosUtil } from '../../../utils/AxiosUtil';
import { AuthenticationManager } from '../../../classes/managers/AuthenticationManager';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { LogManager } from '../../../classes/managers/LogManager';
import { PageEventBusManager } from '../../../classes/managers/PageEventBusManager';
import { RouterManager } from '../../../classes/managers/RouterManager';
import { WindowManager } from '../../../classes/managers/WindowManager';

export type GenericErrorMessageProps = {
  readonly error?: unknown;
  readonly shouldHideActionButtons?: boolean;
};

export const GenericErrorMessage = ({ error, shouldHideActionButtons }: GenericErrorMessageProps) => {
  const [t] = useTranslation();

  useEffect(() => {
    LogManager.instance.log([{
      detail: {
        error,
        stack: (error as Error)?.stack,
      },
      level: isAxiosError(error) ? LogLevel.DEBUG : LogLevel.ERROR,
      topic: (error as Error)?.message ? `Error: ${(error as Error)?.message}` : 'Error',
    }]);
    LogManager.instance.flushLog();
    if (error instanceof Error && ConfigManager.instance.config.enablePageVents) {
      PageEventBusManager.instance.emit('error', error);
    }
  }, [error]);

  const onBackToHomePageButtonClick = useCallback(async () => {
    await RouterManager.instance.router.navigate({
      pathname: '/',
    });
  }, []);

  const onBackButtonClick = useCallback(async () => {
    await RouterManager.instance.router.navigate(-1);
  }, []);

  const onLogoutButtonClick = useCallback(() => {
    AuthenticationManager.clearStaleState();
    WindowManager.instance.window.location.reload();
  }, []);

  const title = useMemo(() => {
    if (isRouteErrorResponse(error) || AxiosUtil.isAxiosNotFoundError(error)) {
      return t`Not found.`;
    }
    if (AxiosUtil.isAxiosForbiddenError(error)) {
      return t`Access denied.`;
    }
    if (AxiosUtil.isAxiosUnprocessableEntityError(error)) {
      return t`Unprocessable Entity.`;
    }
    return t`Sorry, an unexpected error has occurred.`;
  }, [error, t]);

  const message = useMemo(() => {
    if (isRouteErrorResponse(error) || AxiosUtil.isAxiosNotFoundError(error)) {
      return t`The item you requested can not be found. It may have been moved or deleted.`;
    }
    if (AxiosUtil.isAxiosForbiddenError(error)) {
      return t`You don't have access to this page or item.`;
    }
    if (AxiosUtil.isAxiosUnprocessableEntityError(error)) {
      return t`We were unable to process this page or item.`;
    }
    return t('We have encountered a problem. The error has been automatically logged. One of our staff will look into it shortly. Error message: {{message}}', { message: (error as Error)?.message ?? t`Unknown` });
  }, [error, t]);

  const shouldShowStackTrace = useMemo(() => {
    return !isAxiosError(error) && (error as Error)?.stack;
  }, [error]);

  return (
    <Box>
      <Box paddingY={1}>
        <Typography
          variant={'h1'}
        >
          {title}
        </Typography>
      </Box>
      <Box paddingY={1}>
        <Typography
          variant={'body2'}
        >
          {message}
        </Typography>
      </Box>
      {shouldShowStackTrace && (
        <Box paddingY={1}>
          <Typography variant={'h6'}>
            {t`Details for our technicians`}
          </Typography>
          <Box
            component={'pre'}
            sx={{
              fontSize: '0.8rem',
            }}
          >
            {(error as Error)?.stack}
          </Box>
        </Box>
      )}
      {!shouldHideActionButtons && (
        <Box
          paddingY={1}
          sx={{
            display: 'flex',
            gap: 1,
          }}
        >
          <Button
            color={'primary'}
            variant={'outlined'}
            onClick={onLogoutButtonClick}
          >
            {t`Logout`}
          </Button>
          <Button
            color={'primary'}
            variant={'outlined'}
            onClick={onBackToHomePageButtonClick}
          >
            {t`Go back to homepage`}
          </Button>
          <Button
            color={'secondary'}
            onClick={onBackButtonClick}
          >
            {t`Go back`}
          </Button>
        </Box>
      )}
    </Box>
  );
};
