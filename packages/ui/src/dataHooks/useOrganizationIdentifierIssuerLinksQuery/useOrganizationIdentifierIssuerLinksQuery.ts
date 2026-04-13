import { type UseQueryResult } from '@tanstack/react-query';
import type { OrganizationIdentifierIssuerLink } from '@gen-epix/api-casedb';
import { OrganizationApi } from '@gen-epix/api-casedb';

import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';


export const useOrganizationIdentifierIssuerLinksQuery = (): UseQueryResult<OrganizationIdentifierIssuerLink[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await OrganizationApi.instance.organizationIdentifierIssuerLinksGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.IDENTIFIER_ISSUER_LINKS),
  });
};
