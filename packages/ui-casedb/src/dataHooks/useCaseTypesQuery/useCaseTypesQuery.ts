import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbCaseType } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type {
  UseMap,
  UseOptions,
} from '@gen-epix/ui/models/dataHooks';
import { DataHookUtil } from '@gen-epix/ui/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui/hooks/useQueryMemo';

import { CASEDB_QUERY_KEY } from '../../constants/query';


export const caseTypesQueryFn = async ({ signal }: { signal: AbortSignal }): Promise<CaseDbCaseType[]> => {
  const response = await CaseDbCaseApi.getInstance().caseTypesGetAll(null, null, { signal });
  const items = response.data;
  items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
};

export const useCaseTypesQuery = (): UseQueryResult<CaseDbCaseType[]> => {
  return useQueryMemo({
    queryFn: caseTypesQueryFn,
    queryKey: QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASE_TYPES),
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
