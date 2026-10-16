import { container } from 'tsyringe';
import type { UseQueryResult } from '@tanstack/react-query';
import type { CommonDbOrganizationIdentifierIssuerLink } from '@gen-epix/api-commondb';

import { API_ORGANIZATION_TOKEN } from '../../constants/api.constants';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { QueryClientService } from '../../classes/services/QueryClientService';
import { COMMON_QUERY_KEY } from '../../constants/query.constants';


export const useOrganizationIdentifierIssuerLinksQuery = (): UseQueryResult<CommonDbOrganizationIdentifierIssuerLink[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(API_ORGANIZATION_TOKEN).organizationIdentifierIssuerLinksGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(COMMON_QUERY_KEY.IDENTIFIER_ISSUER_LINKS),
  });
};
