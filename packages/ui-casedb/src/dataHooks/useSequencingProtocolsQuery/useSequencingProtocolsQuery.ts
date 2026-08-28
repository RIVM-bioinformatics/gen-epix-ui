import { useMemo } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbProtocol } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type {
  UseMap,
  UseOptions,
} from '@gen-epix/ui/models/dataHooks';
import { DataHookUtil } from '@gen-epix/ui/utils/DataHookUtil';
import { QueryClientService } from '@gen-epix/ui/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui/hooks/useQueryMemo';

import { CASEDB_QUERY_KEY } from '../../constants/query';

export const useSequencingProtocolsQuery = (): UseQueryResult<CaseDbProtocol[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().retrieveSequencingProtocols({ signal });
      return response.data;
    },
    queryKey: QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.SEQUENCING_PROTOCOLS),
  });
};

export const useSequencingProtocolMapQuery = (): UseMap<CaseDbProtocol> => {
  const response = useSequencingProtocolsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbProtocol>(response, item => item.id);
  }, [response]);
};

export const useSequencingProtocolOptionsQuery = (): UseOptions<string> => {
  const response = useSequencingProtocolsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbProtocol>(response, item => item.id, (item: CaseDbProtocol) => item.name);
  }, [response]);
};
