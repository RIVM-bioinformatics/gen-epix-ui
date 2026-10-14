import { container as rootContainer } from 'tsyringe';
import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbCaseRights } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { CASEDB_QUERY_KEY } from '../../constants/query.constants';


export const useCaseRightsQuery = (caseIds: string[], caseTypeId: string, enabled: boolean = true): UseQueryResult<CaseDbCaseRights[]> => {
  return useQueryMemo({
    enabled,
    queryFn: async ({ signal }) => {
      const response = await rootContainer.resolve(CaseDbCaseApi).retrieveCaseRights({
        case_ids: caseIds,
        case_type_id: caseTypeId,
      }, { signal });
      return response.data;
    },
    queryKey: rootContainer.resolve(QueryClientService).getGenericKey(CASEDB_QUERY_KEY.CASE_RIGHTS, caseIds),
  });

};
