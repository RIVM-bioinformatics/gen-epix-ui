import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbRefDim } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type {
  UseMap,
  UseOptions,
} from '@gen-epix/ui';
import {
  CommonDataUtil,
  DataHookUtil,
  QueryClientManager,
  useQueryMemo,
} from '@gen-epix/ui';

import { CASEDB_QUERY_KEY } from '../../data/query';

export const useRefDimsQuery = (): UseQueryResult<CaseDbRefDim[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().refDimsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.REF_DIMS),
  });
};

export const useRefDimMapQuery = (): UseMap<CaseDbRefDim> => {
  const response = useRefDimsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbRefDim>(response, item => item.id);
  }, [response]);
};

export const useRefDimOptionsQuery = (): UseOptions<string> => {
  const dimsQuery = useRefDimsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbRefDim>(dimsQuery, item => item.id, item => item.label, [], CommonDataUtil.rankSortComperatorFactory('label'));
  }, [dimsQuery]);
};
