import type { UseQueryResult } from '@tanstack/react-query';
import type { UserInvitationConstraints } from '@gen-epix/api-casedb';
import {
  CommandName,
  OrganizationApi,
  PermissionType,
} from '@gen-epix/api-casedb';

import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';


export const useInviteUserConstraintsQuery = (): UseQueryResult<UserInvitationConstraints> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      if (!AuthorizationManager.instance.doesUserHavePermission([
        { command_name: CommandName.RetrieveInviteUserConstraintsCommand, permission_type: PermissionType.EXECUTE },
      ])) {
        return {
          organization_ids: [],
          roles: [],
        };
      }

      const response = await OrganizationApi.instance.inviteUserConstraints({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.INVITE_USER_CONSTRAINTS),
  });
};
