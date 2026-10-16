import { container } from 'tsyringe';
import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbGeneticDistanceProtocol } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { DataHookUtil } from '@gen-epix/ui-client-common/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { CASEDB_QUERY_KEY } from '../../constants/query.constants';


export const useGeneticDistanceProtocolsQuery = (): UseQueryResult<CaseDbGeneticDistanceProtocol[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(CaseDbCaseApi).geneticDistanceProtocolsGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(CASEDB_QUERY_KEY.GENETIC_DISTANCE_PROTOCOLS),
  });
};

export const useGeneticDistanceProtocolOptionsQuery = (): UseOptions<string> => {
  const geneticDistanceProtocolsQuery = useGeneticDistanceProtocolsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbGeneticDistanceProtocol>(geneticDistanceProtocolsQuery, item => item.id, item => item.name);

  }, [geneticDistanceProtocolsQuery]);
};
