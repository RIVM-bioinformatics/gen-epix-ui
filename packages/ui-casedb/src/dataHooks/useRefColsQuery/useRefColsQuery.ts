import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbRefCol } from '@gen-epix/api-casedb';
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

export const useRefColsQuery = (): UseQueryResult<CaseDbRefCol[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().refColsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryManager.getInstance().getGenericKey(QUERY_KEY.REF_COLS),
  });
};

export const useRefColMapQuery = (): UseMap<CaseDbRefCol> => {
  const response = useRefColsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbRefCol>(response, item => item.id);
  }, [response]);
};

export const useRefColOptionsQuery = (): UseOptions<string> => {
  const colsQuery = useRefColsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbRefCol>(colsQuery, item => item.id, item => item.label, [], CommonDataUtil.rankSortComperatorFactory('label'));
  }, [colsQuery]);
};
