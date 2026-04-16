import { type UseQueryResult } from '@tanstack/react-query';
import type { CaseDbCaseSetRights } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';

import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useCaseSetRightsQuery = (caseSetIds: string[]): UseQueryResult<CaseDbCaseSetRights[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.instance.retrieveCaseSetRights(caseSetIds, { signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SET_RIGHTS, caseSetIds),
  });
};
