import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbRefColValidationRulesResponseBody } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import {
  QUERY_KEY,
  QueryManager,
  useQueryMemo,
} from '@gen-epix/ui';


export const useRefColsValidationRulesQuery = (): UseQueryResult<CaseDbRefColValidationRulesResponseBody> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().refColsValidationRules({ signal });
      return response.data;
    },
    queryKey: QueryManager.getInstance().getGenericKey(QUERY_KEY.REF_COLS_VALIDATION_RULES),
  });
};
