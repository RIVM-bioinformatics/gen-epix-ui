import { useMemo } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';
import type { IdentifierIssuer } from '@gen-epix/api-casedb';
import { OrganizationApi } from '@gen-epix/api-casedb';

import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

type Select = (data: IdentifierIssuer[]) => IdentifierIssuer[];

export const useIdentifierIssuersQuery = (select?: Select): UseQueryResult<IdentifierIssuer[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await OrganizationApi.instance.identifierIssuersGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.IDENTIFIER_ISSUERS),
    select: select ? (data) => select(data) : undefined,
  });
};

export const useIdentifierIssuerMapQuery = (select?: Select): UseMap<IdentifierIssuer> => {
  const response = useIdentifierIssuersQuery(select);

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<IdentifierIssuer>(response, item => item.id);
  }, [response]);
};

export const useIdentifierIssuerOptionsQuery = (select?: Select): UseOptions<string> => {
  const response = useIdentifierIssuersQuery(select);

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<IdentifierIssuer>(response, item => item.id, (item: IdentifierIssuer) => item.name);
  }, [response]);
};
