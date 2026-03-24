import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type PropsWithChildren,
  useRef,
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
import { I18nManager } from '../../../classes/managers/I18nManager';
import type { ConfirmationRefMethods } from '../../ui/Confirmation';
import { Confirmation } from '../../ui/Confirmation';
import { Spinner } from '../../ui/Spinner';


export const ApplicationBootstrap = ({ children }: PropsWithChildren): ReactNode => {
  const { t } = useTranslation();

  const setCategorizedOutages = useStore(outagesStore, (state) => state.setCategorizedOutages);
  const [shouldContinue, setShouldContinue] = useState(false);
  const [buttonsEnabled, setButtonsEnabled] = useState(false);
  const confirmationRef = useRef<ConfirmationRefMethods>(null);
  const newLanguageCode = useRef<string>(null);
  const [isLanguageChanging, setIsLanguageChanging] = useState(false);

  useEffect(() => {
    I18nManager.instance.addEventListener('onUserLanguageChange', (code) => {
      newLanguageCode.current = code;
      confirmationRef.current?.open();
    });
  });

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

  const onLanguageChangeConfirm = useCallback(async () => {
    if (newLanguageCode.current) {
      setIsLanguageChanging(true);
      await I18nManager.instance.switchLanguageConfig(newLanguageCode.current);
      WindowManager.instance.window.location.reload();
    }
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

  if (featureFlagsQuery.error) {
    return (
      <PageContainer
        singleAction
        testIdAttributes={TestIdUtil.createAttributes('FeatureFlagsErrorPage')}
        title={t`Error`}
      >
        <ResponseHandler
          loadables={featureFlagsLoadables}
          loadingMessage={t`Loading`}
        >
          {children}
        </ResponseHandler>
      </PageContainer>
    );
  }

  if (isLanguageChanging) {
    return (
      <PageContainer
        singleAction
        testIdAttributes={TestIdUtil.createAttributes('LanguageChangingPage')}
        title={t`Changing language`}
      >
        <Spinner
          inline
          label={t`Changing language...`}
        />
      </PageContainer>
    );
  }


  if (shouldShowChildren) {
    return (
      <ResponseHandler
        loadables={featureFlagsLoadables}
        loadingMessage={t`Loading`}
      >
        {children}
        <Confirmation
          ref={confirmationRef}
          body={t`Changing language will reload the application. Do you want to continue?`}
          cancelLabel={t`Cancel`}
          confirmLabel={t`Change language`}
          maxWidth={'xs'}
          title={t`Are you sure?`}
          onConfirm={onLanguageChangeConfirm}
        />
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
