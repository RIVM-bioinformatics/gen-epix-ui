import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

import type { User } from '../../api';
import { OrganizationApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';

export const useUsers = (): UseQueryResult<User[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.USERS),
    queryFn: async ({ signal }) => {
      const response = await OrganizationApi.getInstance().usersGetAll({ signal });
      return response.data;
    },
  });
};

export const useUsersMap = (): UseMap<User> => {
  const response = useUsers();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<User>(response, item => item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};

export const useUserOptions = (): UseOptions<string> => {
  const response = useUsers();
  const [t] = useTranslation();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<User>(response, item => item.id, item => DataUtil.getUserDisplayValue(item, t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response), t]);
};
