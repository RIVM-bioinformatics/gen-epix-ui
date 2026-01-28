import { type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { EtiologicalAgent } from '../../api';
import { OntologyApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useEtiologicalAgentsQuery = (): UseQueryResult<EtiologicalAgent[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.ETIOLOGICAL_AGENTS),
    queryFn: async ({ signal }) => {
      const response = await OntologyApi.instance.etiologicalAgentsGetAll({ signal });
      return response.data;
    },
  });
};

export const useEtiologicalAgentsMapQuery = (): UseMap<EtiologicalAgent> => {
  const etiologicalAgentsQuery = useEtiologicalAgentsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<EtiologicalAgent>(etiologicalAgentsQuery, item => item.id);
  }, [etiologicalAgentsQuery]);
};

export const useEtiologicalAgentOptionsQuery = (): UseOptions<string> => {
  const etiologicalAgentsQuery = useEtiologicalAgentsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<EtiologicalAgent>(etiologicalAgentsQuery, item => item.id, item => item.name);
  }, [etiologicalAgentsQuery]);
};
