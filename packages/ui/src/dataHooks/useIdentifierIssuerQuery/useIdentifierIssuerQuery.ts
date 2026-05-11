import { useMemo } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';
import type { CommonDbIdentifierIssuer } from '@gen-epix/api-commondb';

import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { QueryClientManager } from '../../classes/managers/QueryClientManager';
import { COMMON_QUERY_KEY } from '../../data/query';
import { ApiManager } from '../../classes/managers/ApiManager';

type Select = (data: CommonDbIdentifierIssuer[]) => CommonDbIdentifierIssuer[];

export const useIdentifierIssuersQuery = (select?: Select): UseQueryResult<CommonDbIdentifierIssuer[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await ApiManager.getInstance().organizationApi.identifierIssuersGetAll({ signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(COMMON_QUERY_KEY.IDENTIFIER_ISSUERS),
    select: select ? (data) => select(data) : undefined,
  });
};

export const useIdentifierIssuerMapQuery = (select?: Select): UseMap<CommonDbIdentifierIssuer> => {
  const response = useIdentifierIssuersQuery(select);

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CommonDbIdentifierIssuer>(response, item => item.id);
  }, [response]);
};

export const useIdentifierIssuerOptionsQuery = (select?: Select): UseOptions<string> => {
  const response = useIdentifierIssuersQuery(select);

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CommonDbIdentifierIssuer>(response, item => item.id, (item: CommonDbIdentifierIssuer) => item.name);
  }, [response]);
};
