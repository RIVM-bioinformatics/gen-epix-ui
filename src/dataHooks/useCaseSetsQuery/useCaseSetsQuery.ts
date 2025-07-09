import { useMemo } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';
import { format } from 'date-fns';

import type { CaseSet } from '../../api';
import { CaseApi } from '../../api';
import type {
  UseMap,
  UseOptions,
} from '../../models/dataHooks';
import { QUERY_KEY } from '../../models/query';
import { DataUtil } from '../../utils/DataUtil';
import { QueryUtil } from '../../utils/QueryUtil';
import { DATE_FORMAT } from '../../data/date';
import { useQueryMemo } from '../../hooks/useQueryMemo';

export const useCaseSetsQuery = (): UseQueryResult<CaseSet[]> => {
  return useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SETS),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseSetsGetAll({ signal });
      return response.data;
    },
  });
};

export const useCaseSetsMapQuery = (): UseMap<CaseSet> => {
  const response = useCaseSetsQuery();

  return useMemo(() => {
    return DataUtil.createUseMapDataHook<CaseSet>(response, item => item.id);
  }, [response]);
};

export const useCaseSetOptionsQuery = (): UseOptions<string> => {
  const response = useCaseSetsQuery();

  return useMemo(() => {
    return DataUtil.createUseOptionsDataHook<CaseSet>(response, item => item.id, (item: CaseSet) => `${item.name} (${format(item.created_at, DATE_FORMAT.DATE)})`);
  }, [response]);
};
