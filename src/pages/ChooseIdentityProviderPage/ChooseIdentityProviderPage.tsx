import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import type { MouseEvent } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { IdentityProvider } from '../../api';
import { AuthenticationManager } from '../../classes/managers/AuthenticationManager';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { PageContainer } from '../../components/ui/PageContainer';
import { TestIdUtil } from '../../utils/TestIdUtil';

export type ChooseIdentityProviderPageProps = {
  readonly identityProviders: IdentityProvider[];
};

export const ChooseIdentityProviderPage = ({ identityProviders }: ChooseIdentityProviderPageProps) => {
  const [t] = useTranslation();

  const onButtonClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const name = (event.target as HTMLButtonElement).getAttribute('data-name');

    AuthenticationManager.instance.next(identityProviders.find((identityProvider) => identityProvider.name === name));
  }, [identityProviders]);

  return (
    <PageContainer
      singleAction
      testIdAttributes={TestIdUtil.createAttributes('ChooseIdentityProviderPage')}
      title={t`Choose identity provider`}
    >
      <Typography marginBottom={2}>
        {t('Welcome to {{applicationName}}', { applicationName: ConfigManager.instance.config.applicationName })}
      </Typography>
      <Typography marginBottom={2}>
        {t`You need to be logged in to access this application. Login with one of the following identity providers:`}
      </Typography>
      {identityProviders.map((identityProvider) => (
        <Box
          key={identityProvider.name}
          marginY={2}
        >
          <Button
            data-name={identityProvider.name}
            onClick={onButtonClick}
          >
            {identityProvider.label}
          </Button>
        </Box>
      ))}
    </PageContainer>
  );
};
