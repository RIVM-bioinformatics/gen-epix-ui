import { useMemo } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';

import type { AssemblyProtocol } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useAssemblyProtocolsQuery = (): UseQueryResult<AssemblyProtocol[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.ASSEMBLY_PROTOCOLS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().retrieveAssemblyProtocols({ signal });
      return response.data;
    },
  });
};

export const useAssemblyProtocolMapQuery = (): UseMap<AssemblyProtocol> => {
  const response = useAssemblyProtocolsQuery();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<AssemblyProtocol>(response, item => item.id);
  }, [response]);
};

export const useAssemblyProtocolOptionsQuery = (): UseOptions<string> => {
  const response = useAssemblyProtocolsQuery();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<AssemblyProtocol>(response, item => item.id, (item: AssemblyProtocol) => item.name);
  }, [response]);
};
