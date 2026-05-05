import { useMemo } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';
import type { CaseDbCaseSetCategory } from '@gen-epix/api-casedb';
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

export const useCaseSetCategoriesQuery = (): UseQueryResult<CaseDbCaseSetCategory[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.instance.caseSetCategoriesGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SET_CATEGORIES),
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
