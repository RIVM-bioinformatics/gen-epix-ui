import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  PropsWithChildren,
  ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import {
  Box,
  Button,
} from '@mui/material';

import { WindowService } from '../../../classes/services/WindowService';
import { useQueryMemo } from '../../../hooks/useQueryMemo';
import { outagesStore } from '../../../stores/outagesStore';
import { OutageUtil } from '../../../utils/OutageUtil';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import { useArray } from '../../../hooks/useArray';
import { QueryClientService } from '../../../classes/services/QueryClientService';
import { OutageList } from '../../ui/OutageList';
import { PageContainer } from '../../ui/PageContainer';
import { ResponseHandler } from '../../ui/ResponseHandler';
import { COMMON_QUERY_KEY } from '../../../data/query';
import { ApiService } from '../../../classes/services/ApiService';


export const ApplicationBootstrapWithAuthentication = ({ children }: PropsWithChildren): ReactNode => {
  const { t } = useTranslation();

  const setCategorizedOutages = useStore(outagesStore, (state) => state.setCategorizedOutages);
  const [shouldContinue, setShouldContinue] = useState(false);
  const [buttonsEnabled, setButtonsEnabled] = useState(false);

  const outagesQuery = useQueryMemo({
    gcTime: Infinity,
    queryFn: async ({ signal }) => (await ApiService.getInstance().systemApi.retrieveOutages({ signal })).data,
    queryKey: QueryClientService.getInstance().getGenericKey(COMMON_QUERY_KEY.OUTAGES),
    refetchInterval: 5 * 60 * 1000,
    staleTime: Infinity,
  });

  const outagesLoadables = useArray([outagesQuery]);

  const categorizedOutages = useMemo(() => {
    return OutageUtil.getCategorizedOutages(outagesQuery.data ?? []);
  }, [outagesQuery.data]);

  const onRetryButtonClick = useCallback(() => {
    WindowService.getInstance().window.location.reload();
  }, []);

  const onContinuButtonClick = useCallback(() => {
    setShouldContinue(true);
  }, []);

  useEffect(() => {
    if (categorizedOutages) {
      setCategorizedOutages(categorizedOutages);
    }

    const timeout = WindowService.getInstance().window.setTimeout(() => {
      setButtonsEnabled(true);
    }, 5000);

    return () => {
      WindowService.getInstance().window.clearTimeout(timeout);
    };
  }, [categorizedOutages, setCategorizedOutages]);

  const shouldShowOutagePage = !shouldContinue && !outagesQuery.isLoading && !outagesQuery.error && categorizedOutages.activeOutages?.length > 0;

  if (shouldShowOutagePage) {
    return (
      <PageContainer
        singleAction
        testIdAttributes={TestIdUtil.createAttributes('OutagePage')}
        title={t`Outages`}
      >
        <OutageList
          activeOutages={categorizedOutages.activeOutages}
          soonActiveOutages={categorizedOutages.soonActiveOutages}
          visibleOutages={categorizedOutages.visibleOutages}
        />
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            justifyContent: 'flex-end',
          }}
        >
          <Button
            disabled={!buttonsEnabled}
            onClick={onContinuButtonClick}
            variant={'outlined'}
          >
            {t`Continue anyway`}
          </Button>
          <Button
            disabled={!buttonsEnabled}
            onClick={onRetryButtonClick}
            variant={'contained'}
          >
            {t`Retry`}
          </Button>
        </Box>
      </PageContainer>
    );
  }
  if (outagesQuery.error || outagesQuery.isLoading) {
    return (
      <PageContainer
        ignorePageEvent
        singleAction
        testIdAttributes={TestIdUtil.createAttributes('OutagesLoadingPage')}
        title={t`Outages`}
      >
        <ResponseHandler
          loadables={outagesLoadables}
          loadingMessage={t`Loading`}
        >
          {children}
        </ResponseHandler>
      </PageContainer>
    );

  }

  return children;
};
