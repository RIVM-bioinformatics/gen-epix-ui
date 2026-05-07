import { useMemo } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';
import type { CaseDbCaseSetStatus } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type {
  UseMap,
  UseOptions,
} from '@gen-epix/ui';
import {
  DataHookUtil,
  DataUtil,
  QueryClientManager,
  useQueryMemo,
} from '@gen-epix/ui';

import { CASEDB_QUERY_KEY } from '../../data/query';


export const useCaseSetStatusesQuery = (): UseQueryResult<CaseDbCaseSetStatus[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().caseSetStatusesGetAll({ signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASE_SET_STATUSES),
  });
};

export const useCaseSetStatusMapQuery = (): UseMap<CaseDbCaseSetStatus> => {
  const response = useCaseSetStatusesQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbCaseSetStatus>(response, item => item.id);
  }, [response]);
};

export const useCaseSetStatusOptionsQuery = (): UseOptions<string> => {
  const response = useCaseSetStatusesQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbCaseSetStatus>(response, item => item.id, (item: CaseDbCaseSetStatus) => item.name, [], DataUtil.rankSortComperatorFactory('name'));
  }, [response]);
};
