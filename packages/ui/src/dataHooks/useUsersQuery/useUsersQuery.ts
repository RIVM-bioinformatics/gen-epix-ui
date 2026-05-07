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
import { DataUtil } from '../../utils/DataUtil';
import { QueryClientManager } from '../../classes/managers/QueryClientManager';
import { COMMON_QUERY_KEY } from '../../data/query';
import { ApiManager } from '../../classes/managers/ApiManager';

export const useUsersQuery = (): UseQueryResult<CommonDbUser[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await ApiManager.getInstance().organizationApi.usersGetAll({ signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(COMMON_QUERY_KEY.USERS),
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
    return DataHookUtil.createUseOptionsDataHook<CommonDbUser>(usersQuery, item => item.id, item => DataUtil.getUserDisplayValue(item, t));
  }, [t, usersQuery]);
};
