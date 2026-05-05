import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbRefDim } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type {
  UseMap,
  UseOptions,
} from '@gen-epix/ui';
import {
  DataHookUtil,
  CommonDataUtil,
  QUERY_KEY,
  QueryManager,
  useQueryMemo,
} from '@gen-epix/ui';

export const useRefDimsQuery = (): UseQueryResult<CaseDbRefDim[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().refDimsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryManager.getInstance().getGenericKey(QUERY_KEY.REF_DIMS),
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
