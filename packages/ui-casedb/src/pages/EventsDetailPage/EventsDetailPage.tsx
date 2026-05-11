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
  useArray,
  useItemQuery,
  useUpdateBreadcrumb,
} from '@gen-epix/ui';

import { EpiDashboard } from '../../components/epi/EpiDashboard';
import { CASEDB_QUERY_KEY } from '../../data/query';
import { useCaseTypeMapQuery } from '../../dataHooks/useCaseTypesQuery';

export const EventsDetailPage = () => {
  const { t } = useTranslation();
  const { caseSetId, slug } = useParams();

  const caseTypeMapQuery = useCaseTypeMapQuery();
  const updateBreadcrumb = useUpdateBreadcrumb('Event');

  const caseSetQuery = useItemQuery({
    baseQueryKey: CASEDB_QUERY_KEY.CASE_SETS,
    itemId: caseSetId,
    useQueryOptions: {
      queryFn: async ({ signal }) => (await CaseDbCaseApi.getInstance().caseSetsGetOne(caseSetId, { signal })).data,
    },
  });

  const title = useMemo(() => {
    if (!caseSetQuery.data) {
      return t`Event`;
    }
    const caseTypeName = caseTypeMapQuery.isLoading || !caseTypeMapQuery.map.has(caseSetQuery.data.case_type_id) ? '⌛' : caseTypeMapQuery.map.get(caseSetQuery.data.case_type_id).name;

    return `${caseSetQuery.data.name} (${caseTypeName})`;
  }, [caseSetQuery.data, caseTypeMapQuery.isLoading, caseTypeMapQuery.map, t]);

  useEffect(() => {
    updateBreadcrumb(title);
  }, [title, updateBreadcrumb]);

  const loadables = useArray([caseTypeMapQuery, caseSetQuery]);

  return (
    <PageContainer
      fullHeight
      fullWidth
      showBreadcrumbs
      testIdAttributes={TestIdUtil.createAttributes('EventsDetailPage', { 'case-set-id': caseSetId, slug })}
      title={title}
    >
      <ResponseHandler
        loadables={loadables}
      >
        <EpiDashboard
          caseSet={caseSetQuery.data}
          caseTypeId={caseSetQuery.data?.case_type_id}
        />
      </ResponseHandler>
    </PageContainer>
  );
};
