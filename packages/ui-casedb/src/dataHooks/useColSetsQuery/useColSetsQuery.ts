import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbColSet } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type {
  UseMap,
  UseOptions,
} from '@gen-epix/ui/models/dataHooks';
import { DataHookUtil } from '@gen-epix/ui/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui/hooks/useQueryMemo';

import { CASEDB_QUERY_KEY } from '../../constants/query';


export const useColSetsQuery = (): UseQueryResult<CaseDbColSet[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().colSetsGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.COL_SETS),
  });
};

export const useColSetMapQuery = (): UseMap<CaseDbColSet> => {
  const response = useColSetsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbColSet>(response, item => item.id);
  }, [response]);
};

export const useColSetOptionsQuery = (): UseOptions<string> => {
  const response = useColSetsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbColSet>(response, item => item.id, item => item.name);
  }, [response]);
};
