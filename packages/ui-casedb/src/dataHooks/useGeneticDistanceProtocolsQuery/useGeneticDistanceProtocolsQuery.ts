import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbGeneticDistanceProtocol } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type { UseOptions } from '@gen-epix/ui';
import {
  DataHookUtil,
  QUERY_KEY,
  QueryManager,
  useQueryMemo,
} from '@gen-epix/ui';


export const useGeneticDistanceProtocolsQuery = (): UseQueryResult<CaseDbGeneticDistanceProtocol[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().geneticDistanceProtocolsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryManager.getInstance().getGenericKey(QUERY_KEY.GENETIC_DISTANCE_PROTOCOLS),
  });
};

export const useGeneticDistanceProtocolOptionsQuery = (): UseOptions<string> => {
  const geneticDistanceProtocolsQuery = useGeneticDistanceProtocolsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbGeneticDistanceProtocol>(geneticDistanceProtocolsQuery, item => item.id, item => item.name);

  }, [geneticDistanceProtocolsQuery]);
};
