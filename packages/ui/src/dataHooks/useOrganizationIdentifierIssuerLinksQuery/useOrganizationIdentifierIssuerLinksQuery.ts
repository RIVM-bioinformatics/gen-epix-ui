import { type UseQueryResult } from '@tanstack/react-query';
import type { CommonDbOrganizationIdentifierIssuerLink } from '@gen-epix/api-commondb';

import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { ConfigManager } from '../..';


export const useOrganizationIdentifierIssuerLinksQuery = (): UseQueryResult<CommonDbOrganizationIdentifierIssuerLink[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await ConfigManager.getInstance().config.organizationApi.organizationIdentifierIssuerLinksGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.IDENTIFIER_ISSUER_LINKS),
  });
};
