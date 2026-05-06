import type { UseQueryResult } from '@tanstack/react-query';
import type { CommonDbUserInvitationConstraints } from '@gen-epix/api-commondb';
import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';

import { useQueryMemo } from '../../hooks/useQueryMemo';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { QueryKeyManager } from '../../classes/managers/QueryKeyManager';
import { COMMON_QUERY_KEY } from '../../data/query';


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

      const response = await ConfigManager.getInstance().config.organizationApi.inviteUserConstraints({ signal });
      return response.data;
    },
    queryKey: QueryKeyManager.getInstance().getGenericKey(COMMON_QUERY_KEY.INVITE_USER_CONSTRAINTS),
  });
};
