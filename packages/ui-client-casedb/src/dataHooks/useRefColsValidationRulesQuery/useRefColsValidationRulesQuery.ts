import { container } from 'tsyringe';
import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbRefColValidationRulesResponseBody } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { useQueryMemo } from '@gen-epix/ui-client-common/hooks/useQueryMemo';

import { CASEDB_QUERY_KEY } from '../../constants/query.constants';

export const useRefColsValidationRulesQuery = (): UseQueryResult<CaseDbRefColValidationRulesResponseBody> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await container.resolve(CaseDbCaseApi).refColsValidationRules({ signal });
      return response.data;
    },
    queryKey: container.resolve(QueryClientService).getGenericKey(CASEDB_QUERY_KEY.REF_COLS_VALIDATION_RULES),
  });
};
