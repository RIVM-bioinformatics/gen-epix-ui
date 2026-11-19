import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { OmopDbCohortDefinition } from '@gen-epix/api-omopdb';
import { OmopDbOmopApi } from '@gen-epix/api-omopdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';

type Row = { id: string } & OmopDbCohortDefinition;

export const useCohortDefinitionQuery = (): ReturnType<typeof useQueryMemo<Row[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(OmopDbOmopApi).cohortDefinitionsGetAll(null, null, { signal });
      return response.data.map(item => OmopDbAdminUtil.withId(item, 'cohort_definition_id', 'Cohort definition'));
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(OMOPDB_QUERY_KEY.COHORT_DEFINITIONS),
  });
};

export const useCohortDefinitionOptionsQuery = (): UseOptions<string> => {
  const resourceQuery = useCohortDefinitionQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Row>(
      resourceQuery,
      item => OmopDbAdminUtil.getPrimaryKey(item, 'cohort_definition_id', 'Cohort definition'),
      item => typeof item.cohort_definition_name === 'string' && item.cohort_definition_name.trim().length > 0 ? item.cohort_definition_name : OmopDbAdminUtil.getPrimaryKey(item, 'cohort_definition_id', 'Cohort definition'),
    );
  }, [resourceQuery]);
};
