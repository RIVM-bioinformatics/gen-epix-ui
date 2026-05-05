import { useMemo } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';
import type { CommonDbIdentifierIssuer } from '@gen-epix/api-commondb';

import type { UseOptions } from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';
import { ConfigManager } from '../../classes/managers/ConfigManager';

export const useIdentifierIssuerOwnOrganizationQuery = (): UseQueryResult<CommonDbIdentifierIssuer[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const links = (await ConfigManager.getInstance().config.organizationApi.organizationIdentifierIssuerLinksPostQuery({
        key: 'organization_id',
        type: 'EQUALS_UUID',
        value: AuthorizationManager.instance.user.organization_id,
      }, { signal })).data;
      const response = await ConfigManager.getInstance().config.organizationApi.identifierIssuersGetSome(links.map(x => x.identifier_issuer_id).join(','), { signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.IDENTIFIER_ISSUERS_OWN_ORGANIZATION),
  });
};

export const useIdentifierIssuerOwnOrganizationOptionsQuery = (): UseOptions<string> => {
  const response = useIdentifierIssuerOwnOrganizationQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CommonDbIdentifierIssuer>(response, item => item.id, (item: CommonDbIdentifierIssuer) => item.name);
  }, [response]);
};
