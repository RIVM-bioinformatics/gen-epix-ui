import { type UseQueryResult } from '@tanstack/react-query';

import type { CaseRights } from '../../api';
import { CaseApi } from '../../api';
import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useCaseRightsQuery = (caseIds: string[], caseTypeId: string): UseQueryResult<CaseRights[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_RIGHTS, caseIds),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.retrieveCaseRights({
        case_ids: caseIds,
        case_type_id: caseTypeId,
      }, { signal });
      return response.data;
    },
  });

};
