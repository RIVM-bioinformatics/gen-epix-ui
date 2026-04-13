import { useMemo } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';

import type { CaseSet } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { DataUtil } from '../../utils/DataUtil';


export const useCaseSetsQuery = (): UseQueryResult<CaseSet[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.caseSetsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SETS),
  });
};

export const useCaseSetsMapQuery = (): UseMap<CaseSet> => {
  const response = useCaseSetsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseSet>(response, item => item.id);
  }, [response]);
};

export const useCaseSetOptionsQuery = (): UseOptions<string> => {
  const response = useCaseSetsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseSet>(response, item => item.id, (item: CaseSet) => DataUtil.getCaseSetName(item));
  }, [response]);
};
