import {
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import type { EtiologicalAgent } from '../../api';
import { OntologyApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';

export const useEtiologicalAgentsQuery = (): UseQueryResult<EtiologicalAgent[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.ETIOLOGICAL_AGENTS),
    queryFn: async ({ signal }) => {
      const response = await OntologyApi.getInstance().etiologicalAgentsGetAll({ signal });
      return response.data;
    },
  });
};

export const useEtiologicalAgentsMapQuery = (): UseMap<EtiologicalAgent> => {
  const etiologicalAgentsQuery = useEtiologicalAgentsQuery();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<EtiologicalAgent>(etiologicalAgentsQuery, item => item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(etiologicalAgentsQuery)]);
};

export const useEtiologicalAgentOptionsQuery = (): UseOptions<string> => {
  const etiologicalAgentsQuery = useEtiologicalAgentsQuery();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<EtiologicalAgent>(etiologicalAgentsQuery, item => item.id, item => item.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(etiologicalAgentsQuery)]);
};
