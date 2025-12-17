import type { UseQueryResult } from '@tanstack/react-query';

import type { ColValidationRulesResponseBody } from '../../api';
import { CaseApi } from '../../api';
import { QUERY_KEY } from '../../models/query';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useColsValidationRulesQuery = (): UseQueryResult<ColValidationRulesResponseBody> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.COLS_VALIDATION_RULES),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.colsValidationRules({ signal });
      return response.data;
    },
  });
};
