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
  const [t] = useTranslation();
  const { caseSetId, slug } = useParams();

  const caseTypeMapQuery = useCaseTypeMapQuery();
  const updateBreadcrumb = useUpdateBreadcrumb('Event');

  const { isPending, error, data: caseSet } = useItemQuery({
    baseQueryKey: QUERY_KEY.CASE_SETS,
    itemId: caseSetId,
    useQueryOptions: {
      queryFn: async ({ signal }) => (await CaseApi.getInstance().caseSetsGetOne(caseSetId, { signal })).data,
    },
  });

  const title = useMemo(() => {
    if (!caseSet) {
      return t`Event`;
    }
    const caseTypeName = caseTypeMapQuery.isLoading || !caseTypeMapQuery.map.has(caseSet.case_type_id) ? '⌛' : caseTypeMapQuery.map.get(caseSet.case_type_id).name;

    return `${caseSet.name} (${caseTypeName})`;
  }, [caseSet, caseTypeMapQuery.isLoading, caseTypeMapQuery.map, t]);

  useEffect(() => {
    updateBreadcrumb(title);
  }, [title, updateBreadcrumb]);

  const loadables = useArray([caseTypeMapQuery]);

  return (
    <PageContainer
      fullHeight
      fullWidth
      showBreadcrumbs
      testIdAttributes={TestIdUtil.createAttributes('EventsDetailPage', { 'case-set-id': caseSetId, slug })}
      title={title}
    >
      <ResponseHandler
        error={error}
        isLoading={isPending}
        loadables={loadables}
      >
        <EpiDashboard
          caseSet={caseSet}
          caseTypeId={caseSet?.case_type_id}
        />
      </ResponseHandler>
    </PageContainer>
  );
};
