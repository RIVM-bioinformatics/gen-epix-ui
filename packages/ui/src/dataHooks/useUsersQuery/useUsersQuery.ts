import type { UseQueryResult } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import type { CaseDbUser } from '@gen-epix/api-casedb';
import { CaseDbOrganizationApi } from '@gen-epix/api-casedb';

import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { DataUtil } from '../../utils/DataUtil';

export const useUsersQuery = (): UseQueryResult<CaseDbUser[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbOrganizationApi.instance.usersGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.USERS),
  });
};

export const useUsersMapQuery = (): UseMap<CaseDbUser> => {
  const usersQuery = useUsersQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbUser>(usersQuery, item => item.id);
  }, [usersQuery]);
};

export const useUserOptionsQuery = (): UseOptions<string> => {
  const usersQuery = useUsersQuery();
  const { t } = useTranslation();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbUser>(usersQuery, item => item.id, item => DataUtil.getUserDisplayValue(item, t));
  }, [t, usersQuery]);
};
