import {
  PageContainer,
  TestIdUtil,
} from '@gen-epix/ui';
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
