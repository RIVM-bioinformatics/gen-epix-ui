import type { UseQueryResult } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import type { CommonDbUser } from '@gen-epix/api-commondb';

import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { CommonDataUtil } from '../../utils/CommonDataUtil';
import { QueryManager } from '../../classes/managers/QueryManager';

export const useUsersQuery = (): UseQueryResult<CommonDbUser[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await ConfigManager.getInstance().config.organizationApi.usersGetAll({ signal });
      return response.data;
    },
    queryKey: QueryManager.getInstance().getGenericKey(QUERY_KEY.USERS),
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
    return DataHookUtil.createUseOptionsDataHook<CommonDbUser>(usersQuery, item => item.id, item => CommonDataUtil.getUserDisplayValue(item, t));
  }, [t, usersQuery]);
};
