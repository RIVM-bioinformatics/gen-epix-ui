import { type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbEtiologicalAgent } from '@gen-epix/api-casedb';
import { CaseDbOntologyApi } from '@gen-epix/api-casedb';

import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useEtiologicalAgentsQuery = (): UseQueryResult<CaseDbEtiologicalAgent[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbOntologyApi.instance.etiologicalAgentsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.ETIOLOGICAL_AGENTS),
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
