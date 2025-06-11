import { useMemo } from 'react';
import {
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { CaseTypeSetCategory } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';

export const useCaseTypeSetCategoriesQuery = (): UseQueryResult<CaseTypeSetCategory[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_SET_CATEGORIES),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseTypeSetCategoriesGetAll({ signal });
      const items = response.data;
      items.sort((a, b) => a.rank - b.rank);
      return items;
    },
  });
};

export const useCaseTypeSetCategoryMapQuery = (): UseMap<CaseTypeSetCategory> => {
  const response = useCaseTypeSetCategoriesQuery();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<CaseTypeSetCategory>(response, item => item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};

export const useCaseTypeSetCategoryOptionsQuery = (): UseOptions<string> => {
  const response = useCaseTypeSetCategoriesQuery();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<CaseTypeSetCategory>(response, item => item.id, item => item.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};
