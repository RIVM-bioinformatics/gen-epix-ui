import { useTranslation } from 'react-i18next';
import {
  useEffect,
  useMemo,
} from 'react';
import noop from 'lodash/noop';

import { PageContainer } from '../../components/ui/PageContainer';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { EpiUpload } from '../../components/epi/EpiUpload';
import {
  createEpiUploadStore,
  EpiUploadStoreContext,
} from '../../stores/epiUploadStore';

export const UploadPage = () => {
  const { t } = useTranslation();
  const epiUploadStore = useMemo(() => createEpiUploadStore(), []);

  useEffect(() => {
    return () => {
      epiUploadStore.getState().destroy().catch(noop);
    };
  }, [epiUploadStore]);

  return (
    <PageContainer
      showBreadcrumbs
      fullHeight
      fullWidth
      contentHeader={t`Upload`}
      testIdAttributes={TestIdUtil.createAttributes('UploadPage')}
      title={t`Upload`}
    >
      <EpiUploadStoreContext.Provider value={epiUploadStore}>
        <EpiUpload />
      </EpiUploadStoreContext.Provider>
    </PageContainer>
  );
};
