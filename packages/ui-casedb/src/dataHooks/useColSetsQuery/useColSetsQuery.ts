import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbColSet } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type {
  UseMap,
  UseOptions,
} from '@gen-epix/ui';
import {
  DataHookUtil,
  QUERY_KEY,
  QueryManager,
  useQueryMemo,
} from '@gen-epix/ui';


export const useColSetsQuery = (): UseQueryResult<CaseDbColSet[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().colSetsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryManager.getInstance().getGenericKey(QUERY_KEY.COL_SETS),
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
