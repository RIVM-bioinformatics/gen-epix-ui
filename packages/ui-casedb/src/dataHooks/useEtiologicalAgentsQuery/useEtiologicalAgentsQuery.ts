import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbEtiologicalAgent } from '@gen-epix/api-casedb';
import { CaseDbOntologyApi } from '@gen-epix/api-casedb';
import type {
  UseMap,
  UseOptions,
} from '@gen-epix/ui/models/dataHooks';
import { DataHookUtil } from '@gen-epix/ui/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui/hooks/useQueryMemo';

import { CASEDB_QUERY_KEY } from '../../constants/query';

export const useEtiologicalAgentsQuery = (): UseQueryResult<CaseDbEtiologicalAgent[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbOntologyApi.getInstance().etiologicalAgentsGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.ETIOLOGICAL_AGENTS),
  });
};

export const useEtiologicalAgentsMapQuery = (): UseMap<CaseDbEtiologicalAgent> => {
  const etiologicalAgentsQuery = useEtiologicalAgentsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbEtiologicalAgent>(etiologicalAgentsQuery, item => item.id);
  }, [etiologicalAgentsQuery]);
};

export const useEtiologicalAgentOptionsQuery = (): UseOptions<string> => {
  const etiologicalAgentsQuery = useEtiologicalAgentsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbEtiologicalAgent>(etiologicalAgentsQuery, item => item.id, item => item.name);
  }, [etiologicalAgentsQuery]);
};
