import type { UseQueryResult } from '@tanstack/react-query';
import type { CommonDbOrganizationIdentifierIssuerLink } from '@gen-epix/api-commondb';

import { useQueryMemo } from '../../hooks/useQueryMemo';
import { QueryClientService } from '../../classes/services/QueryClientService';
import { COMMON_QUERY_KEY } from '../../data/query';
import { ApiService } from '../../classes/services/ApiService';


export const useOrganizationIdentifierIssuerLinksQuery = (): UseQueryResult<CommonDbOrganizationIdentifierIssuerLink[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await ApiService.getInstance().organizationApi.organizationIdentifierIssuerLinksGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: QueryClientService.getInstance().getGenericKey(COMMON_QUERY_KEY.IDENTIFIER_ISSUER_LINKS),
  });
};
