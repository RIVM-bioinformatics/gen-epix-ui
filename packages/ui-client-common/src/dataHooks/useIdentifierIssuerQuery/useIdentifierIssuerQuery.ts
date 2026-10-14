import { container as rootContainer } from 'tsyringe';
import { useMemo } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { CommonDbIdentifierIssuer } from '@gen-epix/api-commondb';

import { API_ORGANIZATION_TOKEN } from '../../models/api.models';
import type {
  UseMap,
  UseOptions,
} from '../../models/data-hooks.models';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { QueryClientService } from '../../classes/services/QueryClientService';
import { COMMON_QUERY_KEY } from '../../constants/query.constants';

type Select = (data: CommonDbIdentifierIssuer[]) => CommonDbIdentifierIssuer[];

export const useIdentifierIssuersQuery = (select?: Select): UseQueryResult<CommonDbIdentifierIssuer[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await rootContainer.resolve(API_ORGANIZATION_TOKEN).identifierIssuersGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: rootContainer.resolve(QueryClientService).getGenericKey(COMMON_QUERY_KEY.IDENTIFIER_ISSUERS),
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
