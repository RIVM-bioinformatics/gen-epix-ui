import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbOrganization } from '@gen-epix/api-casedb';
import { CaseDbOrganizationApi } from '@gen-epix/api-casedb';

import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { StringUtil } from '../../utils/StringUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useOrganizationsQuery = (): UseQueryResult<CaseDbOrganization[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbOrganizationApi.instance.organizationsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.ORGANIZATIONS),
  });
};

export const useOrganizationMapQuery = (): UseMap<CaseDbOrganization> => {
  const organizationsQuery = useOrganizationsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbOrganization>(organizationsQuery, item => item.id);
  }, [organizationsQuery]);
};

export const useOrganizationOptionsQuery = (): UseOptions<string> => {
  const organizationsQuery = useOrganizationsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbOrganization>(organizationsQuery, item => item.id, item => item.name, [], (a, b) => StringUtil.advancedSortComperator(a.name, b.name));
  }, [organizationsQuery]);
};
