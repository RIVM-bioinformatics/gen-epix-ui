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

type Select = (data: IdentifierIssuer[]) => IdentifierIssuer[];

export const useIdentifierIssuersQuery = (select?: Select): UseQueryResult<IdentifierIssuer[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.ASSEMBLY_PROTOCOLS),
    queryFn: async ({ signal }) => {
      const response = await OrganizationApi.instance.identifierIssuersGetAll({ signal });
      return response.data;
    },
    select: select ? (data) => select(data) : undefined,
  });
};

export const useIdentifierIssuerMapQuery = (select?: Select): UseMap<IdentifierIssuer> => {
  const response = useIdentifierIssuersQuery(select);

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<IdentifierIssuer>(response, item => item.id);
  }, [response]);
};

export const useIdentifierIssuerOptionsQuery = (select?: Select): UseOptions<string> => {
  const response = useIdentifierIssuersQuery(select);

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<IdentifierIssuer>(response, item => item.id, (item: IdentifierIssuer) => item.name);
  }, [response]);
};
