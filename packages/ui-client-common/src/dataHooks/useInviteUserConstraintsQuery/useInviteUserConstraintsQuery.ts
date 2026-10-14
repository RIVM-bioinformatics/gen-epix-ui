import { container as rootContainer } from 'tsyringe';
import type { UseQueryResult } from '@tanstack/react-query';
import type { CommonDbUserInvitationConstraints } from '@gen-epix/api-commondb';
import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';

import { API_ORGANIZATION_TOKEN } from '../../constants/api.constants';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { AuthorizationService } from '../../classes/services/AuthorizationService';
import { QueryClientService } from '../../classes/services/QueryClientService';
import { COMMON_QUERY_KEY } from '../../constants/query.constants';


export const useInviteUserConstraintsQuery = (): UseQueryResult<CommonDbUserInvitationConstraints> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      if (!rootContainer.resolve(AuthorizationService).doesUserHavePermission([
        { command_name: CommonDbCommandName.RetrieveInviteUserConstraintsCommand, permission_type: CommonDbPermissionType.EXECUTE },
      ])) {
        return {
          organization_ids: [],
          roles: [],
        };
      }

      const response = await rootContainer.resolve(API_ORGANIZATION_TOKEN).inviteUserConstraints({ signal });
      return response.data;
    },
    queryKey: rootContainer.resolve(QueryClientService).getGenericKey(COMMON_QUERY_KEY.INVITE_USER_CONSTRAINTS),
  });
};
