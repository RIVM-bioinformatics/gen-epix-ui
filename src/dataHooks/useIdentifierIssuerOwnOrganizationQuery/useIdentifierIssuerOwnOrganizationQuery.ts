import { useMemo } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';

import type { IdentifierIssuer } from '../../api';
import { OrganizationApi } from '../../api';
import type { UseOptions } from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';

export const useIdentifierIssuerOwnOrganizationQuery = (): UseQueryResult<IdentifierIssuer[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.IDENTIFIER_ISSUERS_OWN_ORGANIZATION),
    queryFn: async ({ signal }) => {
      const links = (await OrganizationApi.instance.organizationIdentifierIssuerLinksPostQuery({
        type: 'EQUALS_UUID',
        key: 'organization_id',
        value: AuthorizationManager.instance.user.organization_id,
      }, { signal })).data;
      const response = await OrganizationApi.instance.identifierIssuersGetSome(links.map(x => x.identifier_issuer_id).join(','), { signal });
      return response.data;
    },
  });
};

export const useIdentifierIssuerOwnOrganizationOptionsQuery = (): UseOptions<string> => {
  const response = useIdentifierIssuerOwnOrganizationQuery();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<IdentifierIssuer>(response, item => item.id, (item: IdentifierIssuer) => item.name);
  }, [response]);
};
