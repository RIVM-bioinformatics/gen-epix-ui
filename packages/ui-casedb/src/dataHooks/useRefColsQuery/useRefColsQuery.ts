import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CaseDbRefCol } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';

import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { DataUtil } from '../../utils/DataUtil';

export const useRefColsQuery = (): UseQueryResult<CaseDbRefCol[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.instance.refColsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.REF_COLS),
  });
};

export const useRefColMapQuery = (): UseMap<CaseDbRefCol> => {
  const response = useRefColsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<CaseDbRefCol>(response, item => item.id);
  }, [response]);
};

export const useRefColOptionsQuery = (): UseOptions<string> => {
  const colsQuery = useRefColsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<CaseDbRefCol>(colsQuery, item => item.id, item => item.label, [], DataUtil.rankSortComperatorFactory('label'));
  }, [colsQuery]);
};
