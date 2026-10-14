import { container as rootContainer } from 'tsyringe';
import type { UseQueryResult } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import type { CommonDbUser } from '@gen-epix/api-commondb';

import { API_ORGANIZATION_TOKEN } from '../../models/api.models';
import type {
  UseMap,
  UseOptions,
} from '../../models/data-hooks.models';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { QueryClientService } from '../../classes/services/QueryClientService';
import { COMMON_QUERY_KEY } from '../../constants/query.constants';
import { UserUtil } from '../../utils/UserUtil';

export const useUsersQuery = (): UseQueryResult<CommonDbUser[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await rootContainer.resolve(API_ORGANIZATION_TOKEN).usersGetAll(null, null, { signal });
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
