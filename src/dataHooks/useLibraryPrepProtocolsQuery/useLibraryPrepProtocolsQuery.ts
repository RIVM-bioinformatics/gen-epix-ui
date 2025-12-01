import { useMemo } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';

import type { LibraryPrepProtocol } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useLibraryPrepProtocolsQuery = (): UseQueryResult<LibraryPrepProtocol[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.LIBRARY_PREP_PROTOCOLS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.retrieveLibraryPrepProtocols({ signal });
      return response.data;
    },
  });
};

export const useLibraryPrepProtocolMapQuery = (): UseMap<LibraryPrepProtocol> => {
  const response = useLibraryPrepProtocolsQuery();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<LibraryPrepProtocol>(response, item => item.id);
  }, [response]);
};

export const useLibraryPrepProtocolOptionsQuery = (): UseOptions<string> => {
  const response = useLibraryPrepProtocolsQuery();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<LibraryPrepProtocol>(response, item => item.id, (item: LibraryPrepProtocol) => item.name);
  }, [response]);
};
