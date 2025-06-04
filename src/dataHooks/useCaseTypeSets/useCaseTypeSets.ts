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
import { useCaseTypeSetCategoryMap } from '../useCaseTypeSetCategory';

export const useCaseTypeSets = (): UseQueryResult<CaseTypeSet[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_SETS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseTypeSetsGetAll({ signal });
      return response.data;
    },
  });
};

export const useCaseTypeSetsMap = (): UseMap<CaseTypeSet> => {
  const response = useCaseTypeSets();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<CaseTypeSet>(response, item => item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};

export const useCaseTypeSetOptions = (): UseOptions<string> => {
  const response = useCaseTypeSets();
  const caseTypeSetCategoryMap = useCaseTypeSetCategoryMap();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<CaseTypeSet>(
      response,
      item => item.id,
      item => `${caseTypeSetCategoryMap.map.get(item.case_type_set_category_id)?.name ?? ''} | ${item.name}`,
      [caseTypeSetCategoryMap],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseTypeSetCategoryMap, DataUtil.createMemorizationDependency(response)]);
};
