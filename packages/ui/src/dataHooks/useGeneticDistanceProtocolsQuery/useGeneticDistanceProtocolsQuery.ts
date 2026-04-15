import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbGeneticDistanceProtocol } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';

import type { UseOptions } from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useGeneticDistanceProtocolsQuery = (): UseQueryResult<CaseDbGeneticDistanceProtocol[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.instance.geneticDistanceProtocolsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.GENETIC_DISTANCE_PROTOCOLS),
  });
};

export const useGeneticDistanceProtocolOptionsQuery = (): UseOptions<string> => {
  const geneticDistanceProtocolsQuery = useGeneticDistanceProtocolsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbGeneticDistanceProtocol>(geneticDistanceProtocolsQuery, item => item.id, item => item.name);

  }, [geneticDistanceProtocolsQuery]);
};
