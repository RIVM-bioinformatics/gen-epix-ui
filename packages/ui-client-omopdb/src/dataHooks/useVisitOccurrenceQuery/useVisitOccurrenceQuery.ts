import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { OmopDbVisitOccurrence } from '@gen-epix/api-omopdb';
import { OmopDbOmopApi } from '@gen-epix/api-omopdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';

type Row = { id: string } & OmopDbVisitOccurrence;

export const useVisitOccurrenceQuery = (): ReturnType<typeof useQueryMemo<Row[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(OmopDbOmopApi).visitOccurrencesGetAll(null, null, { signal });
      return response.data.map(item => OmopDbAdminUtil.withId(item, 'visit_occurrence_id', 'Visit occurrence'));
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(OMOPDB_QUERY_KEY.VISIT_OCCURRENCES),
  });
};

export const useVisitOccurrenceOptionsQuery = (): UseOptions<string> => {
  const resourceQuery = useVisitOccurrenceQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Row>(
      resourceQuery,
      item => OmopDbAdminUtil.getPrimaryKey(item, 'visit_occurrence_id', 'Visit occurrence'),
      item => OmopDbAdminUtil.getPrimaryKey(item, 'visit_occurrence_id', 'Visit occurrence'),
    );
  }, [resourceQuery]);
};
