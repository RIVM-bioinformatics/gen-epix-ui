import { useMemo } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbCaseStats } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type { UseMap } from '@gen-epix/ui-client-common/models/dataHooks';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { CASEDB_QUERY_KEY } from '../../constants/query';


export const useCaseSetStatsQuery = (caseSetIds: string[]): UseQueryResult<CaseDbCaseStats[]> => {
  return useQueryMemo({
    enabled: !!caseSetIds?.length,
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().retrieveCaseSetStats({
        case_set_ids: caseSetIds,
      }, { signal });
      return response.data;
    },
    queryKey: QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASE_SET_STATS, caseSetIds),
  });
};

export const useCaseSetStatsMapQuery = (caseSetIds: string[]): UseMap<CaseDbCaseStats> => {
  const response = useCaseSetStatsQuery(caseSetIds);

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbCaseStats>(response, item => item.case_set_id);
  }, [response]);
};
