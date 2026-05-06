import { type UseQueryResult } from '@tanstack/react-query';
import type { CommonDbOrganizationIdentifierIssuerLink } from '@gen-epix/api-commondb';

import { useQueryMemo } from '../../hooks/useQueryMemo';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { QueryClientManager } from '../../classes/managers/QueryClientManager';
import { COMMON_QUERY_KEY } from '../../data/query';


export const useOrganizationIdentifierIssuerLinksQuery = (): UseQueryResult<CommonDbOrganizationIdentifierIssuerLink[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await ConfigManager.getInstance().config.organizationApi.organizationIdentifierIssuerLinksGetAll({ signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(COMMON_QUERY_KEY.IDENTIFIER_ISSUER_LINKS),
  });
};
