import { useMemo } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';
import type { CaseDbCaseSetCategory } from '@gen-epix/api-casedb';
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


export const useCaseSetCategoriesQuery = (): UseQueryResult<CaseDbCaseSetCategory[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().caseSetCategoriesGetAll({ signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASE_SET_CATEGORIES),
  });
};

export const useCaseSetCategoryMapQuery = (): UseMap<CaseDbCaseSetCategory> => {
  const response = useCaseSetCategoriesQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbCaseSetCategory>(response, item => item.id);
  }, [response]);
};

export const useCaseSetCategoryOptionsQuery = (): UseOptions<string> => {
  const response = useCaseSetCategoriesQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbCaseSetCategory>(response, item => item.id, (item: CaseDbCaseSetCategory) => item.name, [], CommonDataUtil.rankSortComperatorFactory('name'));
  }, [response]);
};
