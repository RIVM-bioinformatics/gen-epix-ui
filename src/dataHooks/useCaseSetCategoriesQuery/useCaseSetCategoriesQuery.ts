import { useMemo } from 'react';
import {
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { CaseSetCategory } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';

export const useCaseSetCategoriesQuery = (): UseQueryResult<CaseSetCategory[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SET_CATEGORIES),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseSetCategoriesGetAll({ signal });
      return response.data;
    },
  });
};

export const useCaseSetCategoryMapQuery = (): UseMap<CaseSetCategory> => {
  const response = useCaseSetCategoriesQuery();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<CaseSetCategory>(response, item => item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};

export const useCaseSetCategoryOptionsQuery = (): UseOptions<string> => {
  const response = useCaseSetCategoriesQuery();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<CaseSetCategory>(response, item => item.id, (item: CaseSetCategory) => item.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};
