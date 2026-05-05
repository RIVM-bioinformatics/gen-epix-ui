import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import {
  useCallback,
  useState,
} from 'react';

import { ConfigManager } from '../../classes/managers/ConfigManager';
import { WindowManager } from '../../classes/managers/WindowManager';
import { PageContainer } from '../../components/ui/PageContainer';
import { ResponseHandler } from '../../components/ui/ResponseHandler';
import { QueryUtil } from '../../utils/QueryUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const AcceptInvitationPage = () => {
  const { token } = useParams();
  const [shouldRegister, setShouldRegister] = useState(false);

  const { data, error, isLoading } = useQueryMemo({
    enabled: shouldRegister,
    gcTime: 0,
    queryFn: async ({ signal }) => {
      const response = await ConfigManager.getInstance().config.organizationApi.userRegistrationsPostOne(token, { signal });
      return response.data;
    },
    queryKey: QueryUtil.getUserRegistrationsKey(token),
    staleTime: 0,
  });

  const { t } = useTranslation();

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
            <Box
              sx={{
                marginY: 2,
              }}
            >
              <Typography>
                {t('You have been invited to join {{applicationName}}.', { applicationName: ConfigManager.getInstance().config.applicationName })}
              </Typography>
            </Box>
            <Box
              sx={{
                marginY: 2,
              }}
            >
              <Button
                color={'primary'}
                onClick={onCompleteRegistrationButtonClick}
                type={'submit'}
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
                {t('You have been successfully registered to {{applicationName}}.', { applicationName: ConfigManager.getInstance().config.applicationName })}
              </Typography>
            </Box>
            <Box
              sx={{
                marginY: 2,
              }}
            >
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
