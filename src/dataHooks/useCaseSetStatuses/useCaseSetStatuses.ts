import { useMemo } from 'react';
import {
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { CaseSetStatus } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';

export const useCaseSetStatuses = (): UseQueryResult<CaseSetStatus[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SET_STATUSES),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseSetStatusesGetAll({ signal });
      return response.data;
    },
  });
};

export const useCaseSetStatusMap = (): UseMap<CaseSetStatus> => {
  const response = useCaseSetStatuses();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<CaseSetStatus>(response, item => item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};

export const useCaseSetStatusOptions = (): UseOptions<string> => {
  const response = useCaseSetStatuses();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<CaseSetStatus>(response, item => item.id, (item: CaseSetStatus) => item.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};
