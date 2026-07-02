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

import { ConfigService } from '../../classes/services/ConfigService';
import { WindowService } from '../../classes/services/WindowService';
import { PageContainer } from '../../components/ui/PageContainer';
import { ResponseHandler } from '../../components/ui/ResponseHandler';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { QueryClientService } from '../../classes/services/QueryClientService';
import { COMMON_QUERY_KEY } from '../../data/query';
import { ApiService } from '../../classes/services/ApiService';

export const AcceptInvitationPage = () => {
  const { token } = useParams();
  const [shouldRegister, setShouldRegister] = useState(false);

  const { data, error, isLoading } = useQueryMemo({
    enabled: shouldRegister,
    gcTime: 0,
    queryFn: async ({ signal }) => {
      const response = await ApiService.getInstance().organizationApi.userRegistrationsPostOne(token, { signal });
      return response.data;
    },
    queryKey: QueryClientService.getInstance().getGenericKey(COMMON_QUERY_KEY.USER_INVITATIONS, token),
    staleTime: 0,
  });

  const { t } = useTranslation();

  const onGoToHomePageButtonClick = useCallback(() => {
    WindowService.getInstance().window.location.href = '/';
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
                {t('You have been invited to join {{applicationName}}.', { applicationName: ConfigService.getInstance().config.applicationName })}
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
                {t('You have been successfully registered to {{applicationName}}.', { applicationName: ConfigService.getInstance().config.applicationName })}
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
