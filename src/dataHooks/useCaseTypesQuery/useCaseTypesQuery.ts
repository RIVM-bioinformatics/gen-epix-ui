import type { UseQueryResult } from '@tanstack/react-query';
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
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useCaseTypesQuery = (): UseQueryResult<CaseType[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPES),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseTypesGetAll({ signal });
      const items = response.data;
      items.sort((a, b) => a.name.localeCompare(b.name));
      return items;
    },
  });
};

export const useCaseTypeMapQuery = (): UseMap<CaseType> => {
  const response = useCaseTypesQuery();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<CaseType>(response, item => item.id);
  }, [response]);
};

export const useCaseTypeOptionsQuery = (): UseOptions<string> => {
  const response = useCaseTypesQuery();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<CaseType>(response, item => item.id, item => item.name);
  }, [response]);
};
