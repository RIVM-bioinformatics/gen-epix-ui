import type { UseQueryResult } from '@tanstack/react-query';
import type { CaseDbRefColValidationRulesResponseBody } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';

import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useRefColsValidationRulesQuery = (): UseQueryResult<CaseDbRefColValidationRulesResponseBody> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.instance.refColsValidationRules({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.REF_COLS_VALIDATION_RULES),
  });
};
