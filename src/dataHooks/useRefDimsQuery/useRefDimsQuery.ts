import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { RefDim } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataHookUtil } from '../../utils/DataHookUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useRefDimsQuery = (): UseQueryResult<RefDim[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.REF_DIMS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.refDimsGetAll({ signal });
      return response.data;
    },
  });
};

export const useRefDimMapQuery = (): UseMap<RefDim> => {
  const response = useRefDimsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseMapDataHook<RefDim>(response, item => item.id);
  }, [response]);
};

export const useRefDimOptionsQuery = (): UseOptions<string> => {
  const dimsQuery = useRefDimsQuery();

  return useMemo(() => {
    return DataHookUtil.createUseOptionsDataHook<RefDim>(dimsQuery, item => item.id, item => item.label);
  }, [dimsQuery]);
};
