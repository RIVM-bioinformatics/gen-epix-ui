import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Typography,
  Box,
} from '@mui/material';
import {
  useCallback,
  useState,
} from 'react';

import { OrganizationApi } from '../../api';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { WindowManager } from '../../classes/managers/WindowManager';
import { PageContainer } from '../../components/ui/PageContainer';
import { ResponseHandler } from '../../components/ui/ResponseHandler';
import { QueryUtil } from '../../utils/QueryUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';

export const AcceptInvitationPage = () => {
  const { token } = useParams();
  const [shouldRegister, setShouldRegister] = useState(false);

  const { data, error, isLoading } = useQuery({
    queryKey: QueryUtil.getUserRegistrationsKey(token),
    queryFn: async ({ signal }) => {
      const response = await OrganizationApi.getInstance().userRegistrationsPostOne(token, { signal });
      return response.data;
    },
    enabled: shouldRegister,
    gcTime: 0,
    staleTime: 0,
  });

  const [t] = useTranslation();

  const onGoToHomePageButtonClick = useCallback(() => {
    WindowManager.instance.window.location.href = '/';
  }, []);

  const onCompleteRegistrationButtonClick = useCallback(() => {
    setShouldRegister(true);
  }, []);

  return (
    <PageContainer
      singleAction
      testIdAttributes={TestIdUtil.createAttributes('AcceptInvitationPage')}
      title={t`Invitation`}
    >
      <ResponseHandler
        enabled={shouldRegister}
        error={error}
        isLoading={isLoading}
      >
        {!data && (
          <>
            <Box marginY={2}>
              <Typography>
                {t('You have been invited to join {{applicationName}}.', { applicationName: ConfigManager.instance.config.applicationName })}
              </Typography>
            </Box>
            <Box marginY={2}>
              <Button
                color={'primary'}
                type={'submit'}
                onClick={onCompleteRegistrationButtonClick}
              >
                {t`Complete registration`}
              </Button>
            </Box>
          </>
        )}
        {data && (
          <>
            <Box>
              <Typography>
                {t('You have been successfully registered to {{applicationName}}.', { applicationName: ConfigManager.instance.config.applicationName })}
              </Typography>
            </Box>
            <Box marginY={2}>
              <Button
                color={'primary'}
                onClick={onGoToHomePageButtonClick}
              >
                {t`Click here to visit the home page`}
              </Button>
            </Box>
          </>
        )}
      </ResponseHandler>
    </PageContainer>
  );
};
