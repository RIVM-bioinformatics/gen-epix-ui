import { useMemo } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbCaseSetCategory } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type {
  UseMap,
  UseOptions,
} from '@gen-epix/ui';
import {
  DataHookUtil,
  QueryClientService,
  useQueryMemo,
} from '@gen-epix/ui';
import { DataUtil } from '@gen-epix/ui-core/utils/DataUtil';

import { CASEDB_QUERY_KEY } from '../../constants/query';


export const useCaseSetCategoriesQuery = (): UseQueryResult<CaseDbCaseSetCategory[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().caseSetCategoriesGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASE_SET_CATEGORIES),
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
    return DataHookUtil.createUseOptionsDataHook<CaseDbCaseSetCategory>(response, item => item.id, (item: CaseDbCaseSetCategory) => item.name, [], DataUtil.rankSortComperatorFactory('name'));
  }, [response]);
};
