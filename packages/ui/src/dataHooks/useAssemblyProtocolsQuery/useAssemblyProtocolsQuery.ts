import { useMemo } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';
import type { CaseDbProtocol } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';

import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useAssemblyProtocolsQuery = (): UseQueryResult<CaseDbProtocol[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.instance.retrieveAssemblyProtocols({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.ASSEMBLY_PROTOCOLS),
  });
};

export const useAssemblyProtocolMapQuery = (): UseMap<CaseDbProtocol> => {
  const response = useAssemblyProtocolsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbProtocol>(response, item => item.id);
  }, [response]);
};

export const useAssemblyProtocolOptionsQuery = (): UseOptions<string> => {
  const response = useAssemblyProtocolsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbProtocol>(response, item => item.id, (item: CaseDbProtocol) => item.name);
  }, [response]);
};
