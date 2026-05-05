import { useMemo } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';
import type { CaseDbCaseSet } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';

import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { DataUtil } from '../../utils/DataUtil';


export const useCaseSetsQuery = (): UseQueryResult<CaseDbCaseSet[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.instance.caseSetsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SETS),
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
    return DataHookUtil.createUseOptionsDataHook<CaseDbCaseSet>(response, item => item.id, (item: CaseDbCaseSet) => DataUtil.getCaseSetName(item));
  }, [response]);
};
