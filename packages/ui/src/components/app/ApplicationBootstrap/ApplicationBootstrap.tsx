import {
  type PropsWithChildren,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import {
  Box,
  Button,
} from '@mui/material';
import { SystemApi } from '@gen-epix/api-casedb';

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
  const newLanguageCodeRef = useRef<string>(null);
  const [isLanguageChanging, setIsLanguageChanging] = useState(false);

  useEffect(() => {
    const callback = (code: string) => {
      newLanguageCodeRef.current = code;
      confirmationRef.current?.open();
    };
    I18nManager.instance.addEventListener('onUserLanguageChange', callback);
    return () => {
      I18nManager.instance.removeEventListener('onUserLanguageChange', callback);
    };
  }, []);

  const outagesQuery = useQueryMemo({
    gcTime: Infinity,
    queryFn: async ({ signal }) => (await SystemApi.instance.retrieveOutages({ signal })).data,
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.OUTAGES),
    refetchInterval: 5 * 60 * 1000,
    staleTime: Infinity,
  });

  const outagesLoadables = useArray([outagesQuery]);

  const categorizedOutages = useMemo(() => {
    return OutageUtil.getCategorizedOutages(outagesQuery.data ?? []);
  }, [outagesQuery.data]);

  const onRetryButtonClick = useCallback(() => {
    WindowManager.instance.window.location.reload();
  }, []);

  const onContinuButtonClick = useCallback(() => {
    setShouldContinue(true);
  }, []);

  const onLanguageChangeConfirm = useCallback(async () => {
    if (newLanguageCodeRef.current) {
      setIsLanguageChanging(true);
      await I18nManager.instance.switchLanguageConfig(newLanguageCodeRef.current);
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
    enabled: shouldShowChildren,
    gcTime: Infinity,
    queryFn: async ({ signal }) => (await SystemApi.instance.retrieveFeatureFlags({ signal })).data,
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.FEATURE_FLAGS),
    staleTime: Infinity,
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
          body={t`Changing language will reload the application. Do you want to continue?`}
          cancelLabel={t`Cancel`}
          confirmLabel={t`Change language`}
          maxWidth={'xs'}
          onConfirm={onLanguageChangeConfirm}
          ref={confirmationRef}
          title={t`Are you sure?`}
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
