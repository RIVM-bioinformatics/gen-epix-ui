import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Dim } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useDimsQuery = (): UseQueryResult<Dim[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.DIMS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.dimsGetAll({ signal });
      return response.data;
    },
  });
};

export const useDimMapQuery = (): UseMap<Dim> => {
  const response = useDimsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<Dim>(response, item => item.id);
  }, [response]);
};

export const useDimOptionsQuery = (): UseOptions<string> => {
  const dimsQuery = useDimsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<Dim>(dimsQuery, item => item.id, item => item.label);
  }, [dimsQuery]);
};
