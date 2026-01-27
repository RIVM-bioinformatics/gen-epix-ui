import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { CaseType } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const caseTypesQueryFn = async ({ signal }: { signal: AbortSignal }): Promise<CaseType[]> => {
  const response = await CaseApi.instance.caseTypesGetAll({ signal });
  const items = response.data;
  items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
};

export const useCaseTypesQuery = (): UseQueryResult<CaseType[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPES),
    queryFn: caseTypesQueryFn,
  });
};

export const useCaseTypeMapQuery = (): UseMap<CaseType> => {
  const response = useCaseTypesQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseType>(response, item => item.id);
  }, [response]);
};

export const useCaseTypeOptionsQuery = (): UseOptions<string> => {
  const response = useCaseTypesQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseType>(response, item => item.id, item => item.name);
  }, [response]);
};
