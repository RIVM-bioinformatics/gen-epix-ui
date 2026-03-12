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

import { SystemApi } from '../../../api';
import { WindowManager } from '../../../classes/managers/WindowManager';
import { useQueryMemo } from '../../../hooks/useQueryMemo';
import { QUERY_KEY } from '../../../models/query';
import { outagesStore } from '../../../stores/outagesStore';
import { OutageUtil } from '../../../utils/OutageUtil';
import { QueryUtil } from '../../../utils/QueryUtil';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import { OutageList } from '../../ui/OutageList';
import { PageContainer } from '../../ui/PageContainer';
import { ResponseHandler } from '../../ui/ResponseHandler';
import { useArray } from '../../../hooks/useArray';
import { FeatureFlagsManager } from '../../../classes/managers/FeatureFlagsManager';


export const ApplicationBootstrap = ({ children }: PropsWithChildren): ReactNode => {
  const { t } = useTranslation();

  const setCategorizedOutages = useStore(outagesStore, (state) => state.setCategorizedOutages);
  const [shouldContinue, setShouldContinue] = useState(false);
  const [buttonsEnabled, setButtonsEnabled] = useState(false);

  const outagesQuery = useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.OUTAGES),
    queryFn: async ({ signal }) => (await SystemApi.instance.retrieveOutages({ signal })).data,
    gcTime: Infinity,
    staleTime: Infinity,
    refetchInterval: 5 * 60 * 1000,
  });

  const outagesLoadables = useArray([outagesQuery]);

  const categorizedOutages = useMemo(() => {
    return OutageUtil.getCategorizedOutages(outagesQuery.data ?? []);
  }, [outagesQuery.data]);

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

  const shouldShowChildren = shouldContinue || (!outagesQuery.isLoading && !outagesQuery.error && categorizedOutages.activeOutages?.length === 0);
  const shouldShowOutagePage = !shouldContinue && !outagesQuery.isLoading && !outagesQuery.error && categorizedOutages.activeOutages?.length > 0;

  const featureFlagsQuery = useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.FEATURE_FLAGS),
    queryFn: async ({ signal }) => (await SystemApi.instance.retrieveFeatureFlags({ signal })).data,
    gcTime: Infinity,
    staleTime: Infinity,
    enabled: shouldShowChildren,
  });

  const featureFlagsLoadables = useArray([featureFlagsQuery]);

  useEffect(() => {
    if (featureFlagsQuery.data) {
      FeatureFlagsManager.instance.featureFlags = featureFlagsQuery.data.feature_flags;
    }
  }, [featureFlagsQuery.data]);


  if (shouldShowChildren) {
    return (
      <ResponseHandler
        loadables={featureFlagsLoadables}
        loadingMessage={t`Loading`}
      >
        {children}
      </ResponseHandler>
    );
  }

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

};
