import { container as rootContainer } from 'tsyringe';
import type { UseQueryResult } from '@tanstack/react-query';
import type { CommonDbOrganizationIdentifierIssuerLink } from '@gen-epix/api-commondb';

import { API_ORGANIZATION_TOKEN } from '../../models/api';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { QueryClientService } from '../../classes/services/QueryClientService';
import { COMMON_QUERY_KEY } from '../../constants/query';


export const useOrganizationIdentifierIssuerLinksQuery = (): UseQueryResult<CommonDbOrganizationIdentifierIssuerLink[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await rootContainer.resolve(API_ORGANIZATION_TOKEN).organizationIdentifierIssuerLinksGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: QueryClientService.getInstance().getGenericKey(COMMON_QUERY_KEY.IDENTIFIER_ISSUER_LINKS),
  });
};
