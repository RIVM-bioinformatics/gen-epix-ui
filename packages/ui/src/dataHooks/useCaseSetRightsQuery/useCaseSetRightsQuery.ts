import { type UseQueryResult } from '@tanstack/react-query';

import type { CaseSetRights } from '../../api';
import { CaseApi } from '../../api';
import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useCaseSetRightsQuery = (caseSetIds: string[]): UseQueryResult<CaseSetRights[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SET_RIGHTS, caseSetIds),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.retrieveCaseSetRights(caseSetIds, { signal });
      return response.data;
    },
  });
};
