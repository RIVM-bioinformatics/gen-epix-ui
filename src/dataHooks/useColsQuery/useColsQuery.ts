import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Col } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useColsQuery = (): UseQueryResult<Col[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.COLS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.colsGetAll({ signal });
      return response.data;
    },
  });
};

export const useColMapQuery = (): UseMap<Col> => {
  const response = useColsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<Col>(response, item => item.id);
  }, [response]);
};

export const useColOptionsQuery = (): UseOptions<string> => {
  const colsQuery = useColsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Col>(colsQuery, item => item.id, item => item.label);
  }, [colsQuery]);
};
