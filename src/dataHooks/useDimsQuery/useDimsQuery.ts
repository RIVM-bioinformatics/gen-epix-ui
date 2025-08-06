import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Dim } from '../../api';
import { CaseApi } from '../../api';
import type { UseOptions } from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useDimsQuery = (): UseQueryResult<Dim[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.DIMS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().dimsGetAll({ signal });
      return response.data;
    },
  });
};

export const useDimOptionsQuery = (): UseOptions<string> => {
  const dimsQuery = useDimsQuery();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<Dim>(dimsQuery, item => item.id, item => item.label);
  }, [dimsQuery]);
};
