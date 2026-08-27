import type { UseQueryResult } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import type { CommonDbUser } from '@gen-epix/api-commondb';

import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { QueryClientService } from '../../classes/services/QueryClientService';
import { COMMON_QUERY_KEY } from '../../constants/query';
import { ApiService } from '../../classes/services/ApiService';
import { UserUtil } from '../../utils/UserUtil';

export const useUsersQuery = (): UseQueryResult<CommonDbUser[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await ApiService.getInstance().organizationApi.usersGetAll(null, null, { signal });
      return response.data;
    },
    queryKey: QueryClientService.getInstance().getGenericKey(COMMON_QUERY_KEY.USERS),
  });
};

export const useUsersMapQuery = (): UseMap<CommonDbUser> => {
  const usersQuery = useUsersQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CommonDbUser>(usersQuery, item => item.id);
  }, [usersQuery]);
};

export const useUserOptionsQuery = (): UseOptions<string> => {
  const usersQuery = useUsersQuery();
  const { t } = useTranslation();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CommonDbUser>(usersQuery, item => item.id, item => UserUtil.getUserDisplayValue(item, t));
  }, [t, usersQuery]);
};
