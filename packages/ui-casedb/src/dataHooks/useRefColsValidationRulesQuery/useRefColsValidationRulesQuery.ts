import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbRefColValidationRulesResponseBody } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import {
  QueryKeyManager,
  useQueryMemo,
} from '@gen-epix/ui';

import { CASEDB_QUERY_KEY } from '../../data/query';

export const useRefColsValidationRulesQuery = (): UseQueryResult<CaseDbRefColValidationRulesResponseBody> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().refColsValidationRules({ signal });
      return response.data;
    },
    queryKey: QueryKeyManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.REF_COLS_VALIDATION_RULES),
  });
};
