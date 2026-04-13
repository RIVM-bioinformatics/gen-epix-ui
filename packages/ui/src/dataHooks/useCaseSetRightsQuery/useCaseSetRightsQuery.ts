import { type UseQueryResult } from '@tanstack/react-query';
import type { CaseSetRights } from '@gen-epix/api-casedb';
import { CaseApi } from '@gen-epix/api-casedb';

import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useCaseSetRightsQuery = (caseSetIds: string[]): UseQueryResult<CaseSetRights[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.retrieveCaseSetRights(caseSetIds, { signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SET_RIGHTS, caseSetIds),
  });
};
