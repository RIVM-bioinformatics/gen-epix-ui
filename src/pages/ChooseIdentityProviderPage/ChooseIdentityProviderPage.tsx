import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Tooltip,
  Typography,
} from '@mui/material';
import type { MouseEvent } from 'react';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';

import { AuthenticationManager } from '../../classes/managers/AuthenticationManager';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { PageContainer } from '../../components/ui/PageContainer';
import { TestIdUtil } from '../../utils/TestIdUtil';
import type { IdentityProviderWithAvailability } from '../../models/auth';

export type ChooseIdentityProviderPageProps = {
  readonly identityProvidersWithAvailability: IdentityProviderWithAvailability[];
};

export const ChooseIdentityProviderPage = ({
  identityProvidersWithAvailability,
}: ChooseIdentityProviderPageProps) => {
  const { t } = useTranslation();

  const AfterIdentityProviderSelection =
    ConfigManager.instance.config.login?.AfterIdentityProviderSelection;

  const onIdentityProviderButtonClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const name = (event.target as HTMLButtonElement).getAttribute(
        'data-name',
      );

      AuthenticationManager.instance.next(
        identityProvidersWithAvailability.find(
          (identityProviderWithAvailability) =>
            identityProviderWithAvailability.provider.name === name,
        ).provider,
      );
    },
    [identityProvidersWithAvailability],
  );

  const availableIdentityProviders = useMemo<
    IdentityProviderWithAvailability[]
  >(() => {
    return (
      identityProvidersWithAvailability?.filter((x) => x.isAvailable) ?? []
    );
  }, [identityProvidersWithAvailability]);

  const onRefreshButtonClick = useCallback(() => {
    window.location.reload();
  }, []);

  const refreshButton = useMemo(
    () => (
      <Button
        variant={'outlined'}
        color={'inherit'}
        sx={{ marginTop: 2 }}
        onClick={onRefreshButtonClick}
      >
        {t('Refresh')}
      </Button>
    ),
    [onRefreshButtonClick, t],
  );

  return (
    <PageContainer
      singleAction
      testIdAttributes={TestIdUtil.createAttributes(
        'ChooseIdentityProviderPage',
      )}
      title={t`Choose identity provider`}
    >
      {availableIdentityProviders.length === 0 && (
        <Box
          marginBottom={4}
          marginTop={1}
        >
          <Alert severity={'error'}>
            <AlertTitle>
              {t(
                'No identity providers are currently available. Please try again later.',
              )}
            </AlertTitle>
            {refreshButton}
          </Alert>
        </Box>
      )}
      {availableIdentityProviders.length > 0 && availableIdentityProviders.length !==
        identityProvidersWithAvailability.length && (
        <Box
          marginBottom={4}
          marginTop={1}
        >
          <Alert severity={'info'}>
            <AlertTitle>
              {t('Some identity providers are currently unavailable.')}
            </AlertTitle>
            {refreshButton}
          </Alert>
        </Box>
      )}
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          marginBottom={2}
          variant={'h1'}
        >
          {t('Welcome to {{applicationName}}', {
            applicationName: ConfigManager.instance.config.applicationName,
          })}
        </Typography>
        <Typography marginBottom={2}>
          {t`Please login with one of the following identity providers:`}
        </Typography>
        {identityProvidersWithAvailability.map(
          (identityProviderWithAvailability) => {
            const button = (
              <Button
                data-name={identityProviderWithAvailability.provider.name}
                disabled={!identityProviderWithAvailability.isAvailable}
                onClick={onIdentityProviderButtonClick}
              >
                {identityProviderWithAvailability.provider.label}
              </Button>
            );
            return (
              <Box
                key={identityProviderWithAvailability.provider.name}
                marginY={2}
              >
                {identityProviderWithAvailability.isAvailable && button}
                {!identityProviderWithAvailability.isAvailable && (
                  <Tooltip
                    arrow
                    title={
                      identityProviderWithAvailability.isAvailable
                        ? ''
                        : t(
                          'This identity provider is currently unavailable. Please try again later.',
                        )
                    }
                  >
                    <span>
                      {button}
                    </span>
                  </Tooltip>
                )}
              </Box>
            );
          },
        )}
        {AfterIdentityProviderSelection && <AfterIdentityProviderSelection />}
      </Box>
    </PageContainer>
  );
};
