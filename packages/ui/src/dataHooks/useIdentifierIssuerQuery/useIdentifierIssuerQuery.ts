import { useMemo } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';
import type { CommonDbIdentifierIssuer } from '@gen-epix/api-commondb';

import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { ConfigManager } from '../../classes/managers/ConfigManager';

type Select = (data: CommonDbIdentifierIssuer[]) => CommonDbIdentifierIssuer[];

export const useIdentifierIssuersQuery = (select?: Select): UseQueryResult<CommonDbIdentifierIssuer[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await ConfigManager.getInstance().config.organizationApi.identifierIssuersGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.IDENTIFIER_ISSUERS),
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
