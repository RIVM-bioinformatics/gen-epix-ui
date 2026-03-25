import type { UseQueryResult } from '@tanstack/react-query';

import type { UserInvitationConstraints } from '../../api';
import {
  CommandName,
  OrganizationApi,
  PermissionType,
} from '../../api';
import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';


export const useInviteUserConstraintsQuery = (): UseQueryResult<UserInvitationConstraints> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.INVITE_USER_CONSTRAINTS),
    queryFn: async ({ signal }) => {
      if (!AuthorizationManager.instance.doesUserHavePermission([
        { command_name: CommandName.RetrieveInviteUserConstraintsCommand, permission_type: PermissionType.EXECUTE },
      ])) {
        return {
          roles: [],
          organization_ids: [],
        };
      }

      const response = await OrganizationApi.instance.inviteUserConstraints({ signal });
      return response.data;
    },
  });
};
