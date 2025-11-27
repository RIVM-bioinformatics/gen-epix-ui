import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { IdentifierIssuer } from '../../api';
import { OrganizationApi } from '../../api';
import type { UseOptions } from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useIdentifierIssuersQuery = (): UseQueryResult<IdentifierIssuer[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.IDENTIFIER_ISSUERS),
    queryFn: async ({ signal }) => {
      const response = await OrganizationApi.instance.identifierIssuersGetAll({ signal });
      return response.data;
    },
  });
};

export const useIdentifierIssuerOptionsQuery = (): UseOptions<string> => {
  const query = useIdentifierIssuersQuery();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<IdentifierIssuer>(query, item => item.id, item => item.name);
  }, [query]);
};
