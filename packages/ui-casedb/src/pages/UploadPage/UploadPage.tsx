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

import { Upload } from '../../components/ui/Upload';
import {
  createUploadStore,
  STEP_ORDER_UPLOAD,
  UploadStoreContext,
} from '../../stores/uploadStore';

export const UploadPage = () => {
  const { t } = useTranslation();

  const uploadStore = useMemo(() => createUploadStore({
    stepOrder: STEP_ORDER_UPLOAD,
  }), []);

  useEffect(() => {
    return () => {
      uploadStore.getState().destroy().catch(noop);
    };
  }, [uploadStore]);

  return (
    <PageContainer
      contentHeader={t`Upload`}
      fullHeight
      fullWidth
      showBreadcrumbs
      testIdAttributes={TestIdUtil.createAttributes('UploadPage')}
      title={t`Upload`}
    >
      <UploadStoreContext value={uploadStore}>
        <Upload />
      </UploadStoreContext>
    </PageContainer>
  );
};
