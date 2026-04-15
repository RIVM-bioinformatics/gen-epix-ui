import type { UseQueryResult } from '@tanstack/react-query';
import {
  CaseDbAbacApi,
  type CaseDbOrganizationAccessCasePolicy,
} from '@gen-epix/api-casedb';

import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useOrganizationAccessCasePoliciesQuery = (select?: (data: CaseDbOrganizationAccessCasePolicy[]) => CaseDbOrganizationAccessCasePolicy[]): UseQueryResult<CaseDbOrganizationAccessCasePolicy[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbAbacApi.instance.organizationAccessCasePoliciesGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.ORGANIZATION_ACCESS_CASE_POLICIES),
    select: select ? (data) => select(data) : undefined,
  });
};
