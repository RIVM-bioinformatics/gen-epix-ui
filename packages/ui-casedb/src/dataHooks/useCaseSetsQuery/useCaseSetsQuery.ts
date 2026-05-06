import { useMemo } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';
import type { CaseDbCaseSet } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type {
  UseMap,
  UseOptions,
} from '@gen-epix/ui';
import {
  DataHookUtil,
  QueryKeyManager,
  useQueryMemo,
} from '@gen-epix/ui';

import { CaseDbDataUtil } from '../../utils/CaseDbDataUtil';
import { CASEDB_QUERY_KEY } from '../../data/query';


export const useCaseSetsQuery = (): UseQueryResult<CaseDbCaseSet[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().caseSetsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryKeyManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASE_SETS),
  });
};

export const useCaseSetsMapQuery = (): UseMap<CaseDbCaseSet> => {
  const response = useCaseSetsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbCaseSet>(response, item => item.id);
  }, [response]);
};

export const useCaseSetOptionsQuery = (): UseOptions<string> => {
  const response = useCaseSetsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbCaseSet>(response, item => item.id, (item: CaseDbCaseSet) => CaseDbDataUtil.getCaseSetName(item));
  }, [response]);
};
