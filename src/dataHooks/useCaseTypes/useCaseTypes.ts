import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { CaseType } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';

export const useCaseTypes = (): UseQueryResult<CaseType[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPES),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseTypesGetAll({ signal });
      const items = response.data;
      items.sort((a, b) => a.name.localeCompare(b.name));
      return items;
    },
  });
};

export const useCaseTypeMap = (): UseMap<CaseType> => {
  const response = useCaseTypes();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<CaseType>(response, item => item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};

export const useCaseTypeOptions = (): UseOptions<string> => {
  const response = useCaseTypes();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<CaseType>(response, item => item.id, item => item.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};
