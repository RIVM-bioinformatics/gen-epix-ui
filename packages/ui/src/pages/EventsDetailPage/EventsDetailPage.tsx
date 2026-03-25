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
import { useCaseTypeMapQuery } from '../../dataHooks/useCaseTypesQuery';
import { useArray } from '../../hooks/useArray';
import { useItemQuery } from '../../hooks/useItemQuery';
import { useUpdateBreadcrumb } from '../../hooks/useUpdateBreadcrumb';
import { QUERY_KEY } from '../../models/query';
import { TestIdUtil } from '../../utils/TestIdUtil';

export const EventsDetailPage = () => {
  const { t } = useTranslation();
  const { caseSetId, slug } = useParams();

  const caseTypeMapQuery = useCaseTypeMapQuery();
  const updateBreadcrumb = useUpdateBreadcrumb('Event');

  const caseSetQuery = useItemQuery({
    baseQueryKey: QUERY_KEY.CASE_SETS,
    itemId: caseSetId,
    useQueryOptions: {
      queryFn: async ({ signal }) => (await CaseApi.instance.caseSetsGetOne(caseSetId, { signal })).data,
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
