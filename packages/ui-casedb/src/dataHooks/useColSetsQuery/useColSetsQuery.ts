import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbColSet } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';

import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useColSetsQuery = (): UseQueryResult<CaseDbColSet[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.instance.colSetsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.COL_SETS),
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
