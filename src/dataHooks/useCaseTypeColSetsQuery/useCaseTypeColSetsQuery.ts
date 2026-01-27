import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { CaseTypeColSet } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useCaseTypeColSetsQuery = (): UseQueryResult<CaseTypeColSet[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_COL_SETS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.caseTypeColSetsGetAll({ signal });
      return response.data;
    },
  });
};

export const useCaseTypeColSetsMapQuery = (): UseMap<CaseTypeColSet> => {
  const response = useCaseTypeColSetsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseTypeColSet>(response, item => item.id);
  }, [response]);
};

export const useCaseTypeColSetOptionsQuery = (): UseOptions<string> => {
  const response = useCaseTypeColSetsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseTypeColSet>(response, item => item.id, item => item.name);
  }, [response]);
};
