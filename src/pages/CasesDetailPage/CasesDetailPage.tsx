import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import {
  useEffect,
  useMemo,
} from 'react';

import { CaseApi } from '../../api';
import { EpiDashboard } from '../../components/epi/EpiDashboard';
import { PageContainer } from '../../components/ui/PageContainer';
import { ResponseHandler } from '../../components/ui/ResponseHandler';
import { useItemQuery } from '../../hooks/useItemQuery';
import { useUpdateBreadcrumb } from '../../hooks/useUpdateBreadcrumb';
import { QUERY_KEY } from '../../models/query';
import { TestIdUtil } from '../../utils/TestIdUtil';

export const CasesDetailPage = () => {
  const [t] = useTranslation();
  const { slug, caseTypeId } = useParams();

  const updateBreadcrumb = useUpdateBreadcrumb('Case type');

  const { isPending, error, data: caseType } = useItemQuery({
    baseQueryKey: QUERY_KEY.CASE_TYPES,
    itemId: caseTypeId,
    useQueryOptions: {
      queryFn: async ({ signal }) => (await CaseApi.getInstance().caseTypesGetOne(caseTypeId, { signal })).data,
    },
  });

  const title = useMemo(() => {
    return caseType?.name ? caseType?.name : t`Case`;
  }, [caseType, t]);

  useEffect(() => {
    updateBreadcrumb(title);
  }, [title, updateBreadcrumb]);

  return (
    <PageContainer
      fullHeight
      fullWidth
      showBreadcrumbs
      testIdAttributes={TestIdUtil.createAttributes('CasesDetailPage', { 'case-type-id': caseTypeId, slug })}
      title={title}
    >
      <ResponseHandler
        error={error}
        isPending={isPending}
      >
        <EpiDashboard
          caseTypeId={caseTypeId}
        />
      </ResponseHandler>
    </PageContainer>
  );
};
