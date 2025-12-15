import { useMemo } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';

import type { SequencingProtocol } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useSequencingProtocolsQuery = (): UseQueryResult<SequencingProtocol[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.SEQUENCING_PROTOCOLS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.retrieveSequencingProtocols({ signal });
      return response.data;
    },
  });
};

export const useSequencingProtocolMapQuery = (): UseMap<SequencingProtocol> => {
  const response = useSequencingProtocolsQuery();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<SequencingProtocol>(response, item => item.id);
  }, [response]);
};

export const useSequencingProtocolOptionsQuery = (): UseOptions<string> => {
  const response = useSequencingProtocolsQuery();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<SequencingProtocol>(response, item => item.id, (item: SequencingProtocol) => item.name);
  }, [response]);
};
