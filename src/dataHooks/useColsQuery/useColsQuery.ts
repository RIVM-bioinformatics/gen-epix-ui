import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Col } from '../../api';
import { CaseApi } from '../../api';
import type { UseOptions } from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
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

export const useColOptionsQuery = (): UseOptions<string> => {
  const colsQuery = useColsQuery();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<Col>(colsQuery, item => item.id, item => item.label);
  }, [colsQuery]);
};
