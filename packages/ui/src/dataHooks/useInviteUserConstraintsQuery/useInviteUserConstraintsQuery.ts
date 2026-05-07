import type { UseQueryResult } from '@tanstack/react-query';
import type { CommonDbUserInvitationConstraints } from '@gen-epix/api-commondb';
import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';

import { useQueryMemo } from '../../hooks/useQueryMemo';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';
import { QueryClientManager } from '../../classes/managers/QueryClientManager';
import { COMMON_QUERY_KEY } from '../../data/query';
import { ApiManager } from '../../classes/managers/ApiManager';


export const useInviteUserConstraintsQuery = (): UseQueryResult<CommonDbUserInvitationConstraints> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      if (!AuthorizationManager.getInstance().doesUserHavePermission([
        { command_name: CommonDbCommandName.RetrieveInviteUserConstraintsCommand, permission_type: CommonDbPermissionType.EXECUTE },
      ])) {
        return {
          organization_ids: [],
          roles: [],
        };
      }

      const response = await ApiManager.getInstance().organizationApi.inviteUserConstraints({ signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(COMMON_QUERY_KEY.INVITE_USER_CONSTRAINTS),
  });
};
