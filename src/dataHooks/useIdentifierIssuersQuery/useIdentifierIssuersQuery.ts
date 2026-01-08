import { useMemo } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';

import type { IdentifierIssuer } from '../../api';
import { OrganizationApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useIdentifierIssuersQuery = (): UseQueryResult<IdentifierIssuer[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.ASSEMBLY_PROTOCOLS),
    queryFn: async ({ signal }) => {
      const response = await OrganizationApi.instance.identifierIssuersGetAll({ signal });
      return response.data;
    },
  });
};

export const useIdentifierIssuerMapQuery = (): UseMap<IdentifierIssuer> => {
  const response = useIdentifierIssuersQuery();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<IdentifierIssuer>(response, item => item.id);
  }, [response]);
};

export const useIdentifierIssuerOptionsQuery = (): UseOptions<string> => {
  const response = useIdentifierIssuersQuery();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<IdentifierIssuer>(response, item => item.id, (item: IdentifierIssuer) => item.name);
  }, [response]);
};
