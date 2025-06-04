import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Dim } from '../../api';
import { CaseApi } from '../../api';
import type { UseOptions } from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';

export const useDims = (): UseQueryResult<Dim[]> => {
  return useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.DIMS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().dimsGetAll({ signal });
      return response.data;
    },
  });
};

export const useDimOptions = (): UseOptions<string> => {
  const response = useDims();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<Dim>(response, item => item.id, item => item.label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DataUtil.createMemorizationDependency(response)]);
};
