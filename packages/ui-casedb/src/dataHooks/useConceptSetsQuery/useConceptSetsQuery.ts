import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbConceptSet } from '@gen-epix/api-casedb';
import { CaseDbOntologyApi } from '@gen-epix/api-casedb';
import type {
  UseMap,
  UseOptions,
} from '@gen-epix/ui/models/dataHooks';
import { DataHookUtil } from '@gen-epix/ui/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui/hooks/useQueryMemo';

import { CASEDB_QUERY_KEY } from '../../constants/query';


export const useConceptSetsQuery = (): UseQueryResult<CaseDbConceptSet[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbOntologyApi.getInstance().conceptSetsGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.CONCEPT_SETS),
  });
};

export const useConceptSetMapQuery = (): UseMap<CaseDbConceptSet> => {
  const response = useConceptSetsQuery();
  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbConceptSet>(response, item => item.id);
  }, [response]);
};

export const useConceptSetOptionsQuery = (): UseOptions<string> => {
  const conceptSetsQuery = useConceptSetsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbConceptSet>(conceptSetsQuery, item => item.id, item => item.name);
  }, [conceptSetsQuery]);
};
