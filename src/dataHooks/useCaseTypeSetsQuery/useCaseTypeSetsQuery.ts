import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { CaseTypeSet } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useCaseTypeSetCategoryMapQuery } from '../useCaseTypeSetCategoriesQuery';

export const useCaseTypeSetsQuery = (): UseQueryResult<CaseTypeSet[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_SETS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseTypeSetsGetAll({ signal });
      return response.data;
    },
  });
};

export const useCaseTypeSetsMapQuery = (): UseMap<CaseTypeSet> => {
  const caseTypeSetsQuery = useCaseTypeSetsQuery();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<CaseTypeSet>(caseTypeSetsQuery, item => item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(caseTypeSetsQuery)]);
};

export const useCaseTypeSetOptionsQuery = (): UseOptions<string> => {
  const caseTypeSetsQuery = useCaseTypeSetsQuery();
  const caseTypeSetCategoryMapQuery = useCaseTypeSetCategoryMapQuery();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<CaseTypeSet>(
      caseTypeSetsQuery,
      item => item.id,
      item => `${caseTypeSetCategoryMapQuery.map.get(item.case_type_set_category_id)?.name ?? ''} | ${item.name}`,
      [caseTypeSetCategoryMapQuery],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseTypeSetCategoryMapQuery, DataUtil.createMemorizationDependency(caseTypeSetsQuery)]);
};
