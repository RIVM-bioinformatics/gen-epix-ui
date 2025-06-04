import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { CaseTypeColSet } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';

export const useCaseTypeColSets = (): UseQueryResult<CaseTypeColSet[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_COL_SETS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseTypeColSetsGetAll({ signal });
      return response.data;
    },
  });
};

export const useCaseTypeColSetsMap = (): UseMap<CaseTypeColSet> => {
  const response = useCaseTypeColSets();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<CaseTypeColSet>(response, item => item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};

export const useCaseTypeColSetOptions = (): UseOptions<string> => {
  const response = useCaseTypeColSets();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<CaseTypeColSet>(response, item => item.id, item => item.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};
