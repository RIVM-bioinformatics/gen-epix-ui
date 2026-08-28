import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbGeneticDistanceProtocol } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type { UseOptions } from '@gen-epix/ui/models/dataHooks';
import { DataHookUtil } from '@gen-epix/ui/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui/hooks/useQueryMemo';

import { CASEDB_QUERY_KEY } from '../../constants/query';


export const useGeneticDistanceProtocolsQuery = (): UseQueryResult<CaseDbGeneticDistanceProtocol[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().geneticDistanceProtocolsGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.GENETIC_DISTANCE_PROTOCOLS),
  });
};

export const useGeneticDistanceProtocolOptionsQuery = (): UseOptions<string> => {
  const geneticDistanceProtocolsQuery = useGeneticDistanceProtocolsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbGeneticDistanceProtocol>(geneticDistanceProtocolsQuery, item => item.id, item => item.name);

  }, [geneticDistanceProtocolsQuery]);
};
