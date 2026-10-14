import { container as rootContainer } from 'tsyringe';
import { useMemo } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbCaseSet } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type {
  UseMap,
  UseOptions,
} from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { CaseDbDataUtil } from '../../utils/CaseDbDataUtil';
import { CASEDB_QUERY_KEY } from '../../constants/query.constants';


export const useCaseSetsQuery = (): UseQueryResult<CaseDbCaseSet[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await rootContainer.resolve(CaseDbCaseApi).caseSetsGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: rootContainer.resolve(QueryClientService).getGenericKey(CASEDB_QUERY_KEY.CASE_SETS),
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
