import { useMemo } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';
import type { CaseDbCaseTypeSetCategory } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';

import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { DataUtil } from '../../utils/DataUtil';

export const useCaseTypeSetCategoriesQuery = (): UseQueryResult<CaseDbCaseTypeSetCategory[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.instance.caseTypeSetCategoriesGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_SET_CATEGORIES),
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
