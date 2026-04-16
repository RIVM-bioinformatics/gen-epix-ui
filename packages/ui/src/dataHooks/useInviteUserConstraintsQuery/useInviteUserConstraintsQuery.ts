import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbUserInvitationConstraints } from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbOrganizationApi,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';

import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';


export const useInviteUserConstraintsQuery = (): UseQueryResult<CaseDbUserInvitationConstraints> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      if (!AuthorizationManager.instance.doesUserHavePermission([
        { command_name: CaseDbCommandName.RetrieveInviteUserConstraintsCommand, permission_type: CaseDbPermissionType.EXECUTE },
      ])) {
        return {
          organization_ids: [],
          roles: [],
        };
      }

      const response = await CaseDbOrganizationApi.instance.inviteUserConstraints({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.INVITE_USER_CONSTRAINTS),
  });
};
