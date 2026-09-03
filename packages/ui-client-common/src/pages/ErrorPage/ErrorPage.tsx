import { useTranslation } from 'react-i18next';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';

import { GenericErrorMessage } from '../../components/ui/GenericErrorMessage';
import { PageContainer } from '../../components/ui/PageContainer';

export type ErrorPageProps = {
  readonly error?: unknown;
};

export const ErrorPage = ({ error }: ErrorPageProps) => {
  const { t } = useTranslation();

  return (
    <PageContainer
      singleAction
      testIdAttributes={TestIdUtil.createAttributes('ErrorPage')}
      title={t`Error`}
    >
      <GenericErrorMessage
        error={error}
      />
    </PageContainer>
  );
};
