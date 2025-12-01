import type { UseQueryResult } from '@tanstack/react-query';

import type { UserInvitationConstraints } from '../../api';
import { OrganizationApi } from '../../api';
import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';


export const useInviteUserConstraintsQuery = (): UseQueryResult<UserInvitationConstraints> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.INVITE_USER_CONSTRAINTS),
    queryFn: async ({ signal }) => {
      const response = await OrganizationApi.instance.inviteUserConstraints({ signal });
      return response.data;
    },
  });
};
