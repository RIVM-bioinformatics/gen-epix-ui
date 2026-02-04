import { useRouteError } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { GenericErrorMessage } from '../../components/ui/GenericErrorMessage';
import { PageContainer } from '../../components/ui/PageContainer';
import { TestIdUtil } from '../../utils/TestIdUtil';

export const RouterErrorPage = () => {
  const error = useRouteError();
  const { t } = useTranslation();

  return (
    <PageContainer
      singleAction
      testIdAttributes={TestIdUtil.createAttributes('RouterErrorPage')}
      title={t`Error`}
    >
      <GenericErrorMessage
        error={error}
      />
    </PageContainer>
  );
};
