import { useMemo } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { CommonDbIdentifierIssuer } from '@gen-epix/api-commondb';

import type { UseOptions } from '../../models/dataHooks';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';
import { QueryClientManager } from '../../classes/managers/QueryClientManager';
import { COMMON_QUERY_KEY } from '../../data/query';
import { ApiManager } from '../../classes/managers/ApiManager';

export const useIdentifierIssuerOwnOrganizationQuery = (): UseQueryResult<CommonDbIdentifierIssuer[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const links = (await ApiManager.getInstance().organizationApi.organizationIdentifierIssuerLinksPostQuery({
        key: 'organization_id',
        type: 'EQUALS_UUID',
        value: AuthorizationManager.getInstance().user.organization_id,
      }, { signal })).data;
      const response = await ApiManager.getInstance().organizationApi.identifierIssuersGetSome(links.map(x => x.identifier_issuer_id).join(','), { signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(COMMON_QUERY_KEY.IDENTIFIER_ISSUERS_OWN_ORGANIZATION),
  });
};

export const useIdentifierIssuerOwnOrganizationOptionsQuery = (): UseOptions<string> => {
  const response = useIdentifierIssuerOwnOrganizationQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CommonDbIdentifierIssuer>(response, item => item.id, (item: CommonDbIdentifierIssuer) => item.name);
  }, [response]);
};
