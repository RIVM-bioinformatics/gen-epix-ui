import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { OmopDbConditionOccurrence } from '@gen-epix/api-omopdb';
import { OmopDbOmopApi } from '@gen-epix/api-omopdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';

type Row = { id: string } & OmopDbConditionOccurrence;

export const useConditionOccurrenceQuery = (): ReturnType<typeof useQueryMemo<Row[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(OmopDbOmopApi).conditionOccurrencesGetAll(null, null, { signal });
      return response.data.map(item => OmopDbAdminUtil.withId(item, 'condition_occurrence_id', 'Condition occurrence'));
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(OMOPDB_QUERY_KEY.CONDITION_OCCURRENCES),
  });
};

export const useConditionOccurrenceOptionsQuery = (): UseOptions<string> => {
  const resourceQuery = useConditionOccurrenceQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Row>(
      resourceQuery,
      item => OmopDbAdminUtil.getPrimaryKey(item, 'condition_occurrence_id', 'Condition occurrence'),
      item => OmopDbAdminUtil.getPrimaryKey(item, 'condition_occurrence_id', 'Condition occurrence'),
    );
  }, [resourceQuery]);
};
