import { container } from 'tsyringe';
import { useMemo } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { CommonDbIdentifierIssuer } from '@gen-epix/api-commondb';

import { API_ORGANIZATION_TOKEN } from '../../constants/api.constants';
import type { UseOptions } from '../../models/data-hooks.models';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { AuthorizationService } from '../../classes/services/AuthorizationService';
import { QueryClientService } from '../../classes/services/QueryClientService';
import { COMMON_QUERY_KEY } from '../../constants/query.constants';

export const useIdentifierIssuerOwnOrganizationQuery = (): UseQueryResult<CommonDbIdentifierIssuer[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const links = (await container.resolve(API_ORGANIZATION_TOKEN).organizationIdentifierIssuerLinksPostQuery({
        key: 'organization_id',
        type: 'EQUALS_UUID',
        value: container.resolve(AuthorizationService).user.organization_id,
      }, null, null, { signal })).data;
      if (links.length === 0) {
        return [];
      }
      const response = await container.resolve(API_ORGANIZATION_TOKEN).identifierIssuersGetSome(links.map(x => x.identifier_issuer_id).join(','), { signal });
      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(COMMON_QUERY_KEY.IDENTIFIER_ISSUERS_OWN_ORGANIZATION),
  });
};

export const useIdentifierIssuerOwnOrganizationOptionsQuery = (): UseOptions<string> => {
  const response = useIdentifierIssuerOwnOrganizationQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CommonDbIdentifierIssuer>(response, item => item.id, (item: CommonDbIdentifierIssuer) => item.name);
  }, [response]);
};
