import { type UseQueryResult } from '@tanstack/react-query';

import type { OrganizationIdentifierIssuerLink } from '../../api';
import { OrganizationApi } from '../../api';
import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';


export const useOrganizationIdentifierIssuerLinksQuery = (): UseQueryResult<OrganizationIdentifierIssuerLink[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.IDENTIFIER_ISSUER_LINKS),
    queryFn: async ({ signal }) => {
      const response = await OrganizationApi.instance.organizationIdentifierIssuerLinksGetAll({ signal });
      return response.data;
    },
  });
};
