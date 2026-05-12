import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import {
  useEffect,
  useMemo,
} from 'react';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import {
  PageContainer,
  ResponseHandler,
  TestIdUtil,
  useItemQuery,
  useUpdateBreadcrumb,
} from '@gen-epix/ui';

import { EpiDashboard } from '../../components/epi/EpiDashboard';
import { CASEDB_QUERY_KEY } from '../../data/query';


export const CasesDetailPage = () => {
  const { t } = useTranslation();
  const { caseTypeId, slug } = useParams();

  console.log('CasesDetailPage render', { caseTypeId, slug });

  const updateBreadcrumb = useUpdateBreadcrumb('Case type');

  const { data: caseType, error, isLoading } = useItemQuery({
    baseQueryKey: CASEDB_QUERY_KEY.CASE_TYPES,
    itemId: caseTypeId,
    useQueryOptions: {
      queryFn: async ({ signal }) => (await CaseDbCaseApi.getInstance().caseTypesGetOne(caseTypeId, { signal })).data,
    },
  });

  console.log('CasesDetailPage render - caseType', { caseType, error, isLoading });

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
        isLoading={isLoading}
      >
        <EpiDashboard
          caseTypeId={caseTypeId}
        />
      </ResponseHandler>
    </PageContainer>
  );
};
