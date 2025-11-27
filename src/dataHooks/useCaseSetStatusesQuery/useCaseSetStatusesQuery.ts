import { useMemo } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';

import type { CaseSetStatus } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useCaseSetStatusesQuery = (): UseQueryResult<CaseSetStatus[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SET_STATUSES),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.caseSetStatusesGetAll({ signal });
      return response.data;
    },
  });
};

export const useCaseSetStatusMapQuery = (): UseMap<CaseSetStatus> => {
  const response = useCaseSetStatusesQuery();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<CaseSetStatus>(response, item => item.id);
  }, [response]);
};

export const useCaseSetStatusOptionsQuery = (): UseOptions<string> => {
  const response = useCaseSetStatusesQuery();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<CaseSetStatus>(response, item => item.id, (item: CaseSetStatus) => item.name);
  }, [response]);
};
