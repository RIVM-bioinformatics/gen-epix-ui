import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Col } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';

export const useCols = (): UseQueryResult<Col[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.COLS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().colsGetAll({ signal });
      return response.data;
    },
  });
};

export const useColsMap = (): UseMap<Col> => {
  const response = useCols();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<Col>(response, item => item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};

export const useColOptions = (): UseOptions<string> => {
  const response = useCols();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<Col>(response, item => item.id, item => item.label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};
