import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Col } from '../../api';
import { CaseApi } from '../../api';
import type { UseOptions } from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';

export const useColsQuery = (): UseQueryResult<Col[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.COLS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().colsGetAll({ signal });
      return response.data;
    },
  });
};

export const useColOptionsQuery = (): UseOptions<string> => {
  const colsQuery = useColsQuery();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<Col>(colsQuery, item => item.id, item => item.label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(colsQuery)]);
};
