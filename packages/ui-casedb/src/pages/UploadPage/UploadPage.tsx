import { useTranslation } from 'react-i18next';
import {
  useEffect,
  useMemo,
} from 'react';
import noop from 'lodash/noop';
import {
  PageContainer,
  TestIdUtil,
} from '@gen-epix/ui';

import { EpiUpload } from '../../components/epi/EpiUpload';
import {
  createEpiUploadStore,
  EpiUploadStoreContext,
  STEP_ORDER_UPLOAD,
} from '../../stores/epiUploadStore';

export const UploadPage = () => {
  const { t } = useTranslation();

  const epiUploadStore = useMemo(() => createEpiUploadStore({
    stepOrder: STEP_ORDER_UPLOAD,
  }), []);

  useEffect(() => {
    return () => {
      epiUploadStore.getState().destroy().catch(noop);
    };
  }, [epiUploadStore]);

  return (
    <PageContainer
      contentHeader={t`Upload`}
      fullHeight
      fullWidth
      showBreadcrumbs
      testIdAttributes={TestIdUtil.createAttributes('UploadPage')}
      title={t`Upload`}
    >
      <EpiUploadStoreContext value={epiUploadStore}>
        <EpiUpload />
      </EpiUploadStoreContext>
    </PageContainer>
  );
};
