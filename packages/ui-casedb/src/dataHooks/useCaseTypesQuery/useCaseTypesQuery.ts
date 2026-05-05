import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbCaseType } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type {
  UseMap,
  UseOptions,
} from '@gen-epix/ui';
import {
  DataHookUtil,
  QUERY_KEY,
  QueryUtil,
  useQueryMemo,
} from '@gen-epix/ui';


export const caseTypesQueryFn = async ({ signal }: { signal: AbortSignal }): Promise<CaseDbCaseType[]> => {
  const response = await CaseDbCaseApi.instance.caseTypesGetAll({ signal });
  const items = response.data;
  items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
};

export const useCaseTypesQuery = (): UseQueryResult<CaseDbCaseType[]> => {
  return useQueryMemo({
    queryFn: caseTypesQueryFn,
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPES),
  });
};

export const useCaseTypeMapQuery = (): UseMap<CaseDbCaseType> => {
  const response = useCaseTypesQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbCaseType>(response, item => item.id);
  }, [response]);
};

export const useCaseTypeOptionsQuery = (): UseOptions<string> => {
  const response = useCaseTypesQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbCaseType>(response, item => item.id, item => item.name);
  }, [response]);
};
