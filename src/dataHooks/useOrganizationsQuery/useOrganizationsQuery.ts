import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Organization } from '../../api';
import { OrganizationApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { StringUtil } from '../../utils/StringUtil';

export const useOrganizationsQuery = (): UseQueryResult<Organization[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.ORGANIZATIONS),
    queryFn: async ({ signal }) => {
      const response = await OrganizationApi.getInstance().organizationsGetAll({ signal });
      return response.data;
    },
  });
};

export const useOrganizationMapQuery = (): UseMap<Organization> => {
  const organizationsQuery = useOrganizationsQuery();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<Organization>(organizationsQuery, item => item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(organizationsQuery)]);
};

export const useOrganizationOptionsQuery = (): UseOptions<string> => {
  const organizationsQuery = useOrganizationsQuery();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<Organization>(organizationsQuery, item => item.id, item => item.name, [], StringUtil.advancedSortComperator);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(organizationsQuery)]);
};
