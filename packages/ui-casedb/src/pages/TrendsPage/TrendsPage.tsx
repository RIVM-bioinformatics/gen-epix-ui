import { useTranslation } from 'react-i18next';

import { PageContainer } from '../../components/ui/PageContainer';
import { TestIdUtil } from '../../utils/TestIdUtil';

export const TrendsPage = () => {
  const { t } = useTranslation();

  return (
    <PageContainer
      testIdAttributes={TestIdUtil.createAttributes('TrendsPage')}
      title={t`Statistics`}
    >
      {t`Statistics`}
    </PageContainer>
  );
};
