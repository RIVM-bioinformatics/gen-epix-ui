import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { RefCol } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';
import { DataUtil } from '../../utils/DataUtil';

export const useRefColsQuery = (): UseQueryResult<RefCol[]> => {
  return useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.refColsGetAll({ signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.REF_COLS),
  });
};

export const useRefColMapQuery = (): UseMap<RefCol> => {
  const response = useRefColsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<RefCol>(response, item => item.id);
  }, [response]);
};

export const useRefColOptionsQuery = (): UseOptions<string> => {
  const colsQuery = useRefColsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<RefCol>(colsQuery, item => item.id, item => item.label, [], DataUtil.rankSortComperatorFactory('label'));
  }, [colsQuery]);
};
