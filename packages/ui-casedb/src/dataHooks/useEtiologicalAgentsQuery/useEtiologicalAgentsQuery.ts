import { type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbEtiologicalAgent } from '@gen-epix/api-casedb';
import { CaseDbOntologyApi } from '@gen-epix/api-casedb';
import type {
  UseMap,
  UseOptions,
} from '@gen-epix/ui';
import {
  DataHookUtil,
  QueryClientManager,
  useQueryMemo,
} from '@gen-epix/ui';

import { CASEDB_QUERY_KEY } from '../../data/query';

export const useEtiologicalAgentsQuery = (): UseQueryResult<CaseDbEtiologicalAgent[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbOntologyApi.getInstance().etiologicalAgentsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.ETIOLOGICAL_AGENTS),
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
