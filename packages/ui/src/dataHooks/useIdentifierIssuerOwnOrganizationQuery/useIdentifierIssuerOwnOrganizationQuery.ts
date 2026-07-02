import { useMemo } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { CommonDbIdentifierIssuer } from '@gen-epix/api-commondb';

import type { UseOptions } from '../../models/dataHooks';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { AuthorizationService } from '../../classes/services/AuthorizationService';
import { QueryClientService } from '../../classes/services/QueryClientService';
import { COMMON_QUERY_KEY } from '../../data/query';
import { ApiService } from '../../classes/services/ApiService';

export const useIdentifierIssuerOwnOrganizationQuery = (): UseQueryResult<CommonDbIdentifierIssuer[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const links = (await ApiService.getInstance().organizationApi.organizationIdentifierIssuerLinksPostQuery({
        key: 'organization_id',
        type: 'EQUALS_UUID',
        value: AuthorizationService.getInstance().user.organization_id,
      }, null, null, { signal })).data;
      const response = await ApiService.getInstance().organizationApi.identifierIssuersGetSome(links.map(x => x.identifier_issuer_id).join(','), { signal });
      return response.data;
    },
    queryKey: QueryClientService.getInstance().getGenericKey(COMMON_QUERY_KEY.IDENTIFIER_ISSUERS_OWN_ORGANIZATION),
  });
};

export const useIdentifierIssuerOwnOrganizationOptionsQuery = (): UseOptions<string> => {
  const response = useIdentifierIssuerOwnOrganizationQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CommonDbIdentifierIssuer>(response, item => item.id, (item: CommonDbIdentifierIssuer) => item.name);
  }, [response]);
};
