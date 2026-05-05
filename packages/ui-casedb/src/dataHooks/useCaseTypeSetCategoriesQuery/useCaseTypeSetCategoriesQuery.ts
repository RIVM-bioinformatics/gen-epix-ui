import { useMemo } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';
import type { CaseDbCaseTypeSetCategory } from '@gen-epix/api-casedb';
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


export const useCaseTypeSetCategoriesQuery = (): UseQueryResult<CaseDbCaseTypeSetCategory[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().caseTypeSetCategoriesGetAll({ signal });
      return response.data;
    },
    queryKey: QueryManager.getInstance().getGenericKey(QUERY_KEY.CASE_TYPE_SET_CATEGORIES),
  });
};

export const useCaseTypeSetCategoryMapQuery = (): UseMap<CaseDbCaseTypeSetCategory> => {
  const response = useCaseTypeSetCategoriesQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbCaseTypeSetCategory>(response, item => item.id);
  }, [response]);
};

export const useCaseTypeSetCategoryOptionsQuery = (): UseOptions<string> => {
  const response = useCaseTypeSetCategoriesQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbCaseTypeSetCategory>(response, item => item.id, item => item.name, [], CommonDataUtil.rankSortComperatorFactory('name'));
  }, [response]);
};
