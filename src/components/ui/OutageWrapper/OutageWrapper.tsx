import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type PropsWithChildren,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import {
  Box,
  Button,
} from '@mui/material';

import { ResponseHandler } from '../ResponseHandler';
import { PageContainer } from '../PageContainer';
import { SystemApi } from '../../../api';
import { WindowManager } from '../../../classes/managers/WindowManager';
import { QUERY_KEY } from '../../../models/query';
import { outagesStore } from '../../../stores/outagesStore';
import { OutageUtil } from '../../../utils/OutageUtil';
import { QueryUtil } from '../../../utils/QueryUtil';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import { OutageList } from '../OutageList';
import { useQueryMemo } from '../../../hooks/useQueryMemo';

export const OutageWrapper = ({ children }: PropsWithChildren): ReactNode => {
  const { t } = useTranslation();

  const setCategorizedOutages = useStore(outagesStore, (state) => state.setCategorizedOutages);
  const [shouldContinue, setShouldContinue] = useState(false);
  const [buttonsEnabled, setButtonsEnabled] = useState(false);

  const { isLoading: isOutagesPending, error: outagesError, data: outages } = useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.OUTAGES),
    queryFn: async ({ signal }) => (await SystemApi.instance.retrieveOutages({ signal })).data,
    gcTime: Infinity,
    staleTime: Infinity,
    refetchInterval: 5 * 60 * 1000,
  });

  const categorizedOutages = useMemo(() => {
    return OutageUtil.getCategorizedOutages(outages ?? []);
  }, [outages]);

  const onContinuButtonClick = useCallback(() => {
    setShouldContinue(true);
  }, []);

  const onRetryButtonClick = useCallback(() => {
    WindowManager.instance.window.location.reload();
  }, []);

  useEffect(() => {
    if (categorizedOutages) {
      setCategorizedOutages(categorizedOutages);
    }

    const timeout = WindowManager.instance.window.setTimeout(() => {
      setButtonsEnabled(true);
    }, 5000);

    return () => {
      WindowManager.instance.window.clearTimeout(timeout);
    };
  }, [categorizedOutages, setCategorizedOutages]);

  if (!isOutagesPending && !outagesError && categorizedOutages.activeOutages?.length === 0) {
    return children;
  }

  if (!shouldContinue && !isOutagesPending && !outagesError && categorizedOutages.activeOutages.length > 0) {
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
            justifyContent: 'flex-end',
            gap: 1,
          }}
        >
          <Button
            disabled={!buttonsEnabled}
            variant={'outlined'}
            onClick={onContinuButtonClick}
          >
            {t`Continue anyway`}
          </Button>
          <Button
            disabled={!buttonsEnabled}
            variant={'contained'}
            onClick={onRetryButtonClick}
          >
            {t`Retry`}
          </Button>
        </Box>
      </PageContainer>
    );
  }

  if (shouldContinue) {
    return children;
  }

  return (
    <PageContainer
      ignorePageEvent
      singleAction
      testIdAttributes={TestIdUtil.createAttributes('OutagesLoadingPage')}
      title={t`Outages`}
    >
      <ResponseHandler
        error={outagesError}
        isLoading={isOutagesPending}
        loadingMessage={t`Loading`}
      >
        {children}
      </ResponseHandler>
    </PageContainer>
  );

};
