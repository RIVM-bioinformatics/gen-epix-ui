import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { ColSet } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useColSetsQuery = (): UseQueryResult<ColSet[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.colSetsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.COL_SETS),
  });
};

export const useColSetMapQuery = (): UseMap<ColSet> => {
  const response = useColSetsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<ColSet>(response, item => item.id);
  }, [response]);
};

export const useColSetOptionsQuery = (): UseOptions<string> => {
  const response = useColSetsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<ColSet>(response, item => item.id, item => item.name);
  }, [response]);
};
