import type { UseQueryResult } from '@tanstack/react-query';
import type { CommonDbUserInvitationConstraints } from '@gen-epix/api-commondb';
import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';

import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';
import { ConfigManager } from '../../classes/managers/ConfigManager';


export const useInviteUserConstraintsQuery = (): UseQueryResult<CommonDbUserInvitationConstraints> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      if (!AuthorizationManager.instance.doesUserHavePermission([
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
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.INVITE_USER_CONSTRAINTS),
  });
};
