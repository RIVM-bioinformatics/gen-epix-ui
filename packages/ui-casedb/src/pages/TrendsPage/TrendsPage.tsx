import { PageContainer } from '@gen-epix/ui';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import { useTranslation } from 'react-i18next';


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
