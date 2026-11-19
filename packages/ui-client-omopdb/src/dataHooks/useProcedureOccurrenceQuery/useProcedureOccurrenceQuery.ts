import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { OmopDbProcedureOccurrence } from '@gen-epix/api-omopdb';
import { OmopDbOmopApi } from '@gen-epix/api-omopdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';
import { OmopDbAdminUtil } from '../../utils/OmopDbAdminUtil';

type Row = { id: string } & OmopDbProcedureOccurrence;

export const useProcedureOccurrenceQuery = (): ReturnType<typeof useQueryMemo<Row[]>> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(OmopDbOmopApi).procedureOccurrencesGetAll(null, null, { signal });
      return response.data.map(item => OmopDbAdminUtil.withId(item, 'procedure_occurrence_id', 'Procedure occurrence'));
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(OMOPDB_QUERY_KEY.PROCEDURE_OCCURRENCES),
  });
};

export const useProcedureOccurrenceOptionsQuery = (): UseOptions<string> => {
  const resourceQuery = useProcedureOccurrenceQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Row>(
      resourceQuery,
      item => OmopDbAdminUtil.getPrimaryKey(item, 'procedure_occurrence_id', 'Procedure occurrence'),
      item => OmopDbAdminUtil.getPrimaryKey(item, 'procedure_occurrence_id', 'Procedure occurrence'),
    );
  }, [resourceQuery]);
};
