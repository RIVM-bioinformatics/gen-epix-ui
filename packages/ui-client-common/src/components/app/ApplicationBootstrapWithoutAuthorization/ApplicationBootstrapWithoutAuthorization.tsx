import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type {
  PropsWithChildren,
  ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';
import { useArray } from '@gen-epix/ui-core/hooks/useArray';
import type { ConfirmationRefMethods } from '@gen-epix/ui-core-components/components/Confirmation';
import { Confirmation } from '@gen-epix/ui-core-components/components/Confirmation';
import { Spinner } from '@gen-epix/ui-core-components/components/Spinner';

import { useQueryMemo } from '../../../hooks/useQueryMemo';
import { FeatureFlagsService } from '../../../classes/services/FeatureFlagsService';
import { I18nService } from '../../../classes/services/I18nService';
import { QueryClientService } from '../../../classes/services/QueryClientService';
import { PageContainer } from '../../ui/PageContainer';
import { ResponseHandler } from '../../ui/ResponseHandler';
import { COMMON_QUERY_KEY } from '../../../constants/query';
import { ApiService } from '../../../classes/services/ApiService';


export const ApplicationBootstrapWithoutAuthorization = ({ children }: PropsWithChildren): ReactNode => {
  const { t } = useTranslation();

  const confirmationRef = useRef<ConfirmationRefMethods>(null);
  const newLanguageCodeRef = useRef<string>(null);
  const [isLanguageChanging, setIsLanguageChanging] = useState(false);

  useEffect(() => {
    const i18nService = I18nService.getInstance();
    const callback = (code: string) => {
      newLanguageCodeRef.current = code;
      confirmationRef.current?.open();
    };
    i18nService.addEventListener('onUserLanguageChange', callback);
    return () => {
      i18nService.removeEventListener('onUserLanguageChange', callback);
    };
  }, []);

  const onLanguageChangeConfirm = useCallback(async () => {
    if (newLanguageCodeRef.current) {
      setIsLanguageChanging(true);
      await I18nService.getInstance().switchLanguageConfig(newLanguageCodeRef.current);
      WindowService.getInstance().window.location.reload();
    }
  }, []);

  const featureFlagsQuery = useQueryMemo({
    gcTime: Infinity,
    queryFn: async ({ signal }) => (await ApiService.getInstance().systemApi.retrieveFeatureFlags({ signal })).data,
    queryKey: QueryClientService.getInstance().getGenericKey(COMMON_QUERY_KEY.FEATURE_FLAGS),
    staleTime: Infinity,
  });

  if (featureFlagsQuery.data) {
    FeatureFlagsService.getInstance().featureFlags = featureFlagsQuery.data.feature_flags;
  }

  const loadables = useArray([featureFlagsQuery]);

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


  return (
    <ResponseHandler
      loadables={loadables}
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

};
