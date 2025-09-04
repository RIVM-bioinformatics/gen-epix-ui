import { useTranslation } from 'react-i18next';

import { PageContainer } from '../../components/ui/PageContainer';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { EpiUpload } from '../../components/epi/EpiUpload';

export const UploadPage = () => {
  const [t] = useTranslation();

  return (
    <PageContainer
      contentHeader={t`Upload`}
      showBreadcrumbs
      testIdAttributes={TestIdUtil.createAttributes('UploadPage')}
      title={t`Upload`}
    >
      <EpiUpload />
    </PageContainer>
  );
};
