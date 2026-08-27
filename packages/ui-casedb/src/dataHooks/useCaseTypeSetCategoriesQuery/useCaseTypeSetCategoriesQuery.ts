import { useMemo } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbCaseTypeSetCategory } from '@gen-epix/api-casedb';
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


export const useCaseTypeSetCategoriesQuery = (): UseQueryResult<CaseDbCaseTypeSetCategory[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().caseTypeSetCategoriesGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASE_TYPE_SET_CATEGORIES),
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
    return DataHookUtil.createUseOptionsDataHook<CaseDbCaseTypeSetCategory>(response, item => item.id, item => item.name, [], DataUtil.rankSortComperatorFactory('name'));
  }, [response]);
};
